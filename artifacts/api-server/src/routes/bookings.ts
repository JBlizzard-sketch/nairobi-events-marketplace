import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookings, users, vendorProfiles, payments, events, quotes } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import {
  ListMyBookingsQueryParams,
  ConfirmBookingBody,
  CreatePaymentIntentBody,
  DisputeBookingBody,
} from "@workspace/api-zod";
import { notify } from "../services/notify";

const router: IRouter = Router();

// ── helpers ────────────────────────────────────────────────────────────────────

function mockPaymentIntent(amount: number, currency: string, method: string) {
  const id = `pi_mock_${Date.now()}`;
  return {
    paymentIntentId: id,
    clientSecret: `${id}_secret_mock`,
    amount,
    currency,
    paymentMethod: method,
    isMock: true,
  };
}

// ── GET /bookings ─────────────────────────────────────────────────────────────

router.get("/bookings", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const parsed = ListMyBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "validation_error", message: parsed.error.message }); return; }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const vendor = await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.userId, user.id) });
  const conditions = vendor
    ? [or(eq(bookings.plannerId, user.id), eq(bookings.vendorId, vendor.id))!]
    : [eq(bookings.plannerId, user.id)];

  if (parsed.data.status) conditions.push(eq(bookings.status, parsed.data.status));

  const bookingList = await db.query.bookings.findMany({
    where: and(...conditions),
    orderBy: bookings.createdAt,
  });

  // Enrich with vendor business name, event title/date, category, and planner name
  const enriched = await Promise.all(bookingList.map(async b => {
    const [vp, ev, planner] = await Promise.all([
      db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.id, b.vendorId) }),
      db.query.events.findFirst({ where: eq(events.id, b.eventId) }),
      db.query.users.findFirst({ where: eq(users.id, b.plannerId) }),
    ]);
    return {
      ...b,
      vendorBusinessName: vp?.businessName ?? null,
      eventTitle: ev?.title ?? null,
      eventDate: ev?.eventDate ?? null,
      category: vp?.category ?? null,
      plannerName: planner ? (planner.fullName?.trim() || planner.email) : null,
    };
  }));

  res.json(enriched);
});

// ── GET /bookings/:bookingId ───────────────────────────────────────────────────

router.get("/bookings/:bookingId", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  if (!booking) { res.status(404).json({ error: "not_found", message: "Booking not found" }); return; }

  const vendor = await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.userId, user.id) });
  if (booking.plannerId !== user.id && !(vendor && booking.vendorId === vendor.id)) {
    res.status(403).json({ error: "forbidden", message: "Access denied" }); return;
  }

  res.json(booking);
});

// ── POST /bookings/:bookingId/payment-intent ───────────────────────────────────
// Creates a payment intent (real Stripe if STRIPE_SECRET_KEY set, else mock)
// Records the payment in the payments table. Does NOT advance booking status.

router.post("/bookings/:bookingId/payment-intent", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  const parsed = CreatePaymentIntentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "validation_error", message: parsed.error.message }); return; }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.id, bookingId), eq(bookings.plannerId, user.id)),
  });
  if (!booking) { res.status(404).json({ error: "not_found", message: "Booking not found" }); return; }
  if (booking.status !== "pending") {
    res.status(400).json({ error: "invalid_state", message: "Booking is not pending" }); return;
  }

  const amountKes = Math.round(Number(booking.totalAmount) * 100); // minor units
  const { paymentMethod } = parsed.data;

  let result: {
    paymentIntentId: string;
    clientSecret: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    isMock: boolean;
  };

  // When STRIPE_SECRET_KEY is set, swap this block for real Stripe PI creation:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); ...
  result = mockPaymentIntent(amountKes, "kes", paymentMethod);

  // Record in payments table
  await db.insert(payments).values({
    bookingId,
    status: "pending",
    amount: booking.totalAmount,
    currency: booking.currency,
    stripePaymentIntentId: result.paymentIntentId,
  });

  res.json(result);
});

// ── POST /bookings/:bookingId/confirm ─────────────────────────────────────────
// Called after client-side payment is authorised. Advances booking → in_escrow.

router.post("/bookings/:bookingId/confirm", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  const parsed = ConfirmBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "validation_error", message: parsed.error.message }); return; }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.id, bookingId), eq(bookings.plannerId, user.id)),
  });
  if (!booking) { res.status(404).json({ error: "not_found", message: "Booking not found" }); return; }
  if (booking.status !== "pending") {
    res.status(400).json({ error: "invalid_state", message: "Booking already confirmed" }); return;
  }

  const { paymentIntentId } = parsed.data;

  // Update booking → in_escrow
  const [updated] = await db
    .update(bookings)
    .set({ status: "in_escrow", stripePaymentIntentId: paymentIntentId, confirmedAt: new Date(), updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
    .returning();

  // Update payment record → held_in_escrow
  await db
    .update(payments)
    .set({ status: "held_in_escrow", updatedAt: new Date() })
    .where(eq(payments.stripePaymentIntentId, paymentIntentId));

  // Notify vendor: payment is now in escrow
  const vendor = await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.id, updated.vendorId) });
  if (vendor) {
    const vendorUser = await db.query.users.findFirst({ where: eq(users.id, vendor.userId) });
    const event = await db.query.events.findFirst({ where: eq(events.id, updated.eventId) });
    if (vendorUser && event) {
      notify({
        userId: vendorUser.id,
        type: "payment_received",
        title: "Payment Confirmed",
        body: `KES ${Number(updated.vendorPayoutAmount).toLocaleString()} is now held in escrow for "${event.title}". Funds will be released after the event.`,
        metadata: { bookingId: updated.id },
        emailTo: vendorUser.email,
      });
    }
  }

  res.json({ booking: updated, clientSecret: "" });
});

// ── POST /bookings/:bookingId/release ─────────────────────────────────────────
// Planner confirms event went well → releases escrow to vendor.

router.post("/bookings/:bookingId/release", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.id, bookingId), eq(bookings.plannerId, user.id)),
  });
  if (!booking) { res.status(404).json({ error: "not_found", message: "Booking not found" }); return; }
  if (booking.status !== "in_escrow") {
    res.status(400).json({ error: "invalid_state", message: "Booking is not in escrow" }); return;
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
    .returning();

  // Release payment record
  if (booking.stripePaymentIntentId) {
    await db
      .update(payments)
      .set({ status: "released", escrowReleasedAt: new Date(), updatedAt: new Date() })
      .where(eq(payments.stripePaymentIntentId, booking.stripePaymentIntentId));
  }

  // Notify vendor: escrow released
  const relVendor = await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.id, booking.vendorId) });
  if (relVendor) {
    const relVendorUser = await db.query.users.findFirst({ where: eq(users.id, relVendor.userId) });
    const relEvent = await db.query.events.findFirst({ where: eq(events.id, booking.eventId) });
    if (relVendorUser && relEvent) {
      notify({
        userId: relVendorUser.id,
        type: "payment_released",
        title: "Payment Released",
        body: `KES ${Number(booking.vendorPayoutAmount).toLocaleString()} has been released to you for "${relEvent.title}". Thank you for a great event!`,
        metadata: { bookingId: booking.id },
        emailTo: relVendorUser.email,
      });
    }
  }

  res.json(updated);
});

// ── POST /bookings/:bookingId/dispute ─────────────────────────────────────────
// Planner or vendor raises a dispute on an in-escrow booking.

router.post("/bookings/:bookingId/dispute", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  const parsed = DisputeBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "validation_error", message: parsed.error.message }); return; }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  if (!booking) { res.status(404).json({ error: "not_found", message: "Booking not found" }); return; }

  // Allow planner or vendor to dispute
  const vendor = await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.userId, user.id) });
  if (booking.plannerId !== user.id && !(vendor && booking.vendorId === vendor.id)) {
    res.status(403).json({ error: "forbidden", message: "Access denied" }); return;
  }

  if (booking.status !== "in_escrow") {
    res.status(400).json({ error: "invalid_state", message: "Can only dispute in-escrow bookings" }); return;
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: "disputed", cancellationReason: parsed.data.reason, updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))
    .returning();

  // Notify the other party about the dispute
  const dispEvent = await db.query.events.findFirst({ where: eq(events.id, booking.eventId) });
  const dispVendor = await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.id, booking.vendorId) });
  const isPlanner = booking.plannerId === user.id;

  if (isPlanner && dispVendor) {
    // Planner raised dispute → notify vendor
    const dispVendorUser = await db.query.users.findFirst({ where: eq(users.id, dispVendor.userId) });
    if (dispVendorUser && dispEvent) {
      notify({
        userId: dispVendorUser.id,
        type: "payment_received",
        title: "Dispute Raised",
        body: `The planner has raised a dispute for "${dispEvent.title}". Our team will review and contact you within 2 business days. Reason: ${parsed.data.reason}`,
        metadata: { bookingId: booking.id },
        emailTo: dispVendorUser.email,
      });
    }
  } else if (!isPlanner) {
    // Vendor raised dispute → notify planner
    const plannerUser = await db.query.users.findFirst({ where: eq(users.id, booking.plannerId) });
    if (plannerUser && dispEvent) {
      notify({
        userId: plannerUser.id,
        type: "payment_received",
        title: "Dispute Raised",
        body: `The vendor has raised a dispute for "${dispEvent.title}". Our team will review and contact you within 2 business days.`,
        metadata: { bookingId: booking.id },
        emailTo: plannerUser.email,
      });
    }
  }

  res.json(updated);
});

export default router;
