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

const PLATFORM_FEE_PERCENT = 0.1; // 10%

const router: IRouter = Router();

// GET /quotes/requests — vendor's incoming quote requests
router.get("/quotes/requests", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Missing x-clerk-user-id header" });
    return;
  }

  const parsed = ListMyQuoteRequestsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.userId, user.id),
  });
  if (!vendor) {
    res.status(404).json({ error: "not_found", message: "Vendor profile not found" });
    return;
  }

  const conditions = [eq(quoteRequests.vendorId, vendor.id)];
  if (parsed.data.status) conditions.push(eq(quoteRequests.status, parsed.data.status));

  const requestList = await db.query.quoteRequests.findMany({
    where: and(...conditions),
  });

  // Enrich with event data
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
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Missing x-clerk-user-id header" });
    return;
  }

  const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;

  const parsed = SubmitQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.userId, user.id),
  });
  if (!vendor) {
    res.status(404).json({ error: "not_found", message: "Vendor profile not found" });
    return;
  }

  const quoteRequest = await db.query.quoteRequests.findFirst({
    where: and(eq(quoteRequests.id, requestId), eq(quoteRequests.vendorId, vendor.id)),
  });

  if (!quoteRequest) {
    res.status(404).json({ error: "not_found", message: "Quote request not found" });
    return;
  }

  if (quoteRequest.status === "expired") {
    res.status(400).json({ error: "expired", message: "Quote request has expired" });
    return;
  }

  // Mark request as submitted
  await db
    .update(quoteRequests)
    .set({ status: "submitted" })
    .where(eq(quoteRequests.id, requestId));

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

  // Update event status to quotes_received if not already
  await db
    .update(events)
    .set({ status: "quotes_received", updatedAt: new Date() })
    .where(and(eq(events.id, quoteRequest.eventId), eq(events.status, "quotes_requested")));

  res.status(201).json(created);
});

// POST /quotes/:quoteId/accept — planner accepts a quote, creates booking
router.post("/quotes/:quoteId/accept", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Missing x-clerk-user-id header" });
    return;
  }

  const quoteId = Array.isArray(req.params.quoteId) ? req.params.quoteId[0] : req.params.quoteId;

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId) });
  if (!quote) {
    res.status(404).json({ error: "not_found", message: "Quote not found" });
    return;
  }

  // Verify user owns this event
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, quote.eventId), eq(events.plannerId, user.id)),
  });
  if (!event) {
    res.status(403).json({ error: "forbidden", message: "Not your event" });
    return;
  }

  // Update quote status
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

  // Update event to vendor_selected
  await db
    .update(events)
    .set({ status: "vendor_selected", updatedAt: new Date() })
    .where(eq(events.id, event.id));

  res.json(booking);
});

// POST /quotes/:quoteId/reject
router.post("/quotes/:quoteId/reject", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Missing x-clerk-user-id header" });
    return;
  }

  const quoteId = Array.isArray(req.params.quoteId) ? req.params.quoteId[0] : req.params.quoteId;

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const quote = await db.query.quotes.findFirst({ where: eq(quotes.id, quoteId) });
  if (!quote) {
    res.status(404).json({ error: "not_found", message: "Quote not found" });
    return;
  }

  const [updated] = await db
    .update(quotes)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(quotes.id, quoteId))
    .returning();

  res.json(updated);
});

export default router;
