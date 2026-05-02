import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { bookings, users, vendorProfiles } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { ListMyBookingsQueryParams, ConfirmBookingBody } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /bookings
router.get("/bookings", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Missing x-clerk-user-id header" });
    return;
  }

  const parsed = ListMyBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  // Get vendor profile if user is a vendor
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.userId, user.id),
  });

  // Return bookings as planner OR vendor
  const conditions = vendor
    ? [or(eq(bookings.plannerId, user.id), eq(bookings.vendorId, vendor.id))!]
    : [eq(bookings.plannerId, user.id)];

  if (parsed.data.status) conditions.push(eq(bookings.status, parsed.data.status));

  const bookingList = await db.query.bookings.findMany({
    where: and(...conditions),
    orderBy: bookings.createdAt,
  });

  res.json(bookingList);
});

// GET /bookings/:bookingId
router.get("/bookings/:bookingId", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Missing x-clerk-user-id header" });
    return;
  }

  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
  });

  if (!booking) {
    res.status(404).json({ error: "not_found", message: "Booking not found" });
    return;
  }

  // Verify access: planner or vendor on this booking
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.userId, user.id),
  });
  const isPlanner = booking.plannerId === user.id;
  const isVendor = vendor && booking.vendorId === vendor.id;

  if (!isPlanner && !isVendor) {
    res.status(403).json({ error: "forbidden", message: "Access denied" });
    return;
  }

  res.json(booking);
});

// POST /bookings/:bookingId/confirm — confirm booking, mock payment intent
router.post("/bookings/:bookingId/confirm", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Missing x-clerk-user-id header" });
    return;
  }

  const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;

  const parsed = ConfirmBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.id, bookingId), eq(bookings.plannerId, user.id)),
  });

  if (!booking) {
    res.status(404).json({ error: "not_found", message: "Booking not found" });
    return;
  }

  if (booking.status !== "pending") {
    res.status(400).json({ error: "invalid_state", message: "Booking already confirmed" });
    return;
  }

  // Mock Stripe payment intent
  const mockPaymentIntentId = `pi_mock_${Date.now()}`;
  const mockClientSecret = `${mockPaymentIntentId}_secret_mock`;

  const [updated] = await db
    .update(bookings)
    .set({
      status: "in_escrow",
      stripePaymentIntentId: mockPaymentIntentId,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  res.json({ booking: updated, clientSecret: mockClientSecret });
});

export default router;
