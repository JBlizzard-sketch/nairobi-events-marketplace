import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  quotes,
  quoteRequests,
  bookings,
  vendorProfiles,
  events,
  users,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListMyQuoteRequestsQueryParams,
  SubmitQuoteBody,
} from "@workspace/api-zod";
import { notify } from "../services/notify";

const PLATFORM_FEE_PERCENT = 0.1;

const router: IRouter = Router();

// GET /quotes/requests — vendor's incoming quote requests
router.get("/quotes/requests", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const parsed = ListMyQuoteRequestsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "validation_error", message: parsed.error.message }); return; }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const vendor = await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.userId, user.id) });
  if (!vendor) { res.status(404).json({ error: "not_found", message: "Vendor profile not found" }); return; }

  const conditions = [eq(quoteRequests.vendorId, vendor.id)];
  if (parsed.data.status) conditions.push(eq(quoteRequests.status, parsed.data.status));

  const requestList = await db.query.quoteRequests.findMany({ where: and(...conditions) });

  const enriched = await Promise.all(
    requestList.map(async (qr) => {
      const event = await db.query.events.findFirst({ where: eq(events.id, qr.eventId) });
      return { ...qr, event };
    }),
  );

  res.json(enriched);
});

// POST /quotes/requests/:requestId/submit — vendor submits a quote
router.post("/quotes/requests/:requestId/submit", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const parsed = SubmitQuoteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "validation_error", message: parsed.error.message }); return; }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const vendor = await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.userId, user.id) });
  if (!vendor) { res.status(404).json({ error: "not_found", message: "Vendor profile not found" }); return; }

  const quoteRequest = await db.query.quoteRequests.findFirst({
    where: and(eq(quoteRequests.id, requestId), eq(quoteRequests.vendorId, vendor.id)),
  });
  if (!quoteRequest) { res.status(404).json({ error: "not_found", message: "Quote request not found" }); return; }
  if (quoteRequest.status === "expired") { res.status(400).json({ error: "expired", message: "Quote request has expired" }); return; }

  await db.update(quoteRequests).set({ status: "submitted" }).where(eq(quoteRequests.id, requestId));

  const [created] = await db
    .insert(quotes)
    .values({
      quoteRequestId: requestId,
      eventId: quoteRequest.eventId,
      vendorId: vendor.id,
      category: quoteRequest.category,
      status: "submitted",
      ...parsed.data,
    })
    .returning();

  await db
    .update(events)
    .set({ status: "quotes_received", updatedAt: new Date() })
    .where(and(eq(events.id, quoteRequest.eventId), eq(events.status, "quotes_requested")));

  // Notify the planner that a quote has arrived
  const event = await db.query.events.findFirst({ where: eq(events.id, quoteRequest.eventId) });
  if (event) {
    const plannerUser = await db.query.users.findFirst({ where: eq(users.id, event.plannerId) });
    if (plannerUser) {
      notify({
        userId: plannerUser.id,
        type: "quote_received",
        title: "New Quote Received",
        body: `${vendor.businessName} submitted a quote of KES ${Number(parsed.data.totalAmount).toLocaleString()} for ${quoteRequest.category} services on "${event.title}".`,
        metadata: { eventId: event.id, quoteId: created.id, vendorId: vendor.id },
        emailTo: plannerUser.email,
      });
    }
  }

  res.status(201).json(created);
});

// POST /quotes/:quoteId/accept — planner accepts a quote, creates booking
router.post("/quotes/:quoteId/accept", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const quoteId = Array.isArray(req.params.quoteId) ? req.params.quoteId[0] : req.params.quoteId;

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId) });
  if (!quote) { res.status(404).json({ error: "not_found", message: "Quote not found" }); return; }

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, quote.eventId), eq(events.plannerId, user.id)),
  });
  if (!event) { res.status(403).json({ error: "forbidden", message: "Not your event" }); return; }

  await db.update(quotes).set({ status: "accepted", updatedAt: new Date() }).where(eq(quotes.id, quoteId));

  const total = Number(quote.totalAmount);
  const platformFee = Math.round(total * PLATFORM_FEE_PERCENT * 100) / 100;
  const vendorPayout = Math.round((total - platformFee) * 100) / 100;

  const [booking] = await db
    .insert(bookings)
    .values({
      eventId: event.id,
      quoteId: quote.id,
      vendorId: quote.vendorId,
      plannerId: user.id,
      status: "pending",
      totalAmount: String(total),
      platformFeeAmount: String(platformFee),
      vendorPayoutAmount: String(vendorPayout),
      currency: quote.currency,
    })
    .returning();

  await db
    .update(events)
    .set({ status: "vendor_selected", updatedAt: new Date() })
    .where(eq(events.id, event.id));

  // Notify the vendor that their quote was accepted
  const vendor = await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.id, quote.vendorId) });
  if (vendor) {
    const vendorUser = await db.query.users.findFirst({ where: eq(users.id, vendor.userId) });
    if (vendorUser) {
      notify({
        userId: vendorUser.id,
        type: "booking_confirmed",
        title: "Quote Accepted!",
        body: `Your quote for "${event.title}" was accepted. A booking of KES ${total.toLocaleString()} has been created and is awaiting payment.`,
        metadata: { bookingId: booking.id, eventId: event.id },
        emailTo: vendorUser.email,
      });
    }
  }

  res.json(booking);
});

// POST /quotes/:quoteId/reject
router.post("/quotes/:quoteId/reject", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const quoteId = Array.isArray(req.params.quoteId) ? req.params.quoteId[0] : req.params.quoteId;

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId) });
  if (!quote) { res.status(404).json({ error: "not_found", message: "Quote not found" }); return; }

  const [updated] = await db
    .update(quotes)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(quotes.id, quoteId))
    .returning();

  res.json(updated);
});

export default router;
