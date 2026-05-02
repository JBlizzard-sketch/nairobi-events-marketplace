import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  events,
  users,
  quoteRequests,
  vendorProfiles,
  quotes,
} from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  ListMyEventsQueryParams,
  CreateEventBody,
  UpdateEventBody,
} from "@workspace/api-zod";
import { notify } from "../services/notify";

const router: IRouter = Router();

// GET /events
router.get("/events", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const parsed = ListMyEventsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "validation_error", message: parsed.error.message }); return; }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const { status, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [eq(events.plannerId, user.id)];
  if (status) conditions.push(eq(events.status, status));

  const [eventList, countResult] = await Promise.all([
    db.query.events.findMany({
      where: and(...conditions),
      orderBy: desc(events.createdAt),
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)` }).from(events).where(and(...conditions)),
  ]);

  res.json({ events: eventList, total: Number(countResult[0]?.count ?? 0), page, limit });
});

// POST /events
router.post("/events", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "validation_error", message: parsed.error.message }); return; }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const { eventDate, eventEndDate, ...rest } = parsed.data;
  const toDateStr = (d: Date | undefined | null): string | undefined =>
    d instanceof Date ? d.toISOString().split("T")[0] : d ? String(d) : undefined;

  const [created] = await db
    .insert(events)
    .values({
      ...rest,
      eventDate: toDateStr(eventDate)!,
      ...(eventEndDate != null ? { eventEndDate: toDateStr(eventEndDate) } : {}),
      plannerId: user.id,
      status: "draft",
    })
    .returning();

  res.status(201).json(created);
});

// GET /events/:eventId
router.get("/events/:eventId", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) { res.status(404).json({ error: "not_found", message: "Event not found" }); return; }

  res.json(event);
});

// PATCH /events/:eventId
router.patch("/events/:eventId", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "validation_error", message: parsed.error.message }); return; }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const existing = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.plannerId, user.id)),
  });
  if (!existing) { res.status(404).json({ error: "not_found", message: "Event not found" }); return; }
  if (existing.status !== "draft") { res.status(400).json({ error: "invalid_state", message: "Can only edit draft events" }); return; }

  const { eventDate: ed, ...restUpdate } = parsed.data;
  const toDateStr2 = (d: Date | undefined | null): string | undefined =>
    d instanceof Date ? d.toISOString().split("T")[0] : d ? String(d) : undefined;

  const [updated] = await db
    .update(events)
    .set({
      ...restUpdate,
      ...(ed != null ? { eventDate: toDateStr2(ed) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning();

  res.json(updated);
});

// POST /events/:eventId/submit — submit brief and dispatch quote requests
router.post("/events/:eventId/submit", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.plannerId, user.id)),
  });
  if (!event) { res.status(404).json({ error: "not_found", message: "Event not found" }); return; }
  if (event.status !== "draft") { res.status(400).json({ error: "invalid_state", message: "Event already submitted" }); return; }

  const quotesDeadline = new Date(Date.now() + 4 * 60 * 60 * 1000);

  const [updated] = await db
    .update(events)
    .set({ status: "quotes_requested", quotesDeadline, updatedAt: new Date() })
    .where(eq(events.id, eventId))
    .returning();

  // Dispatch quote requests + notify matched vendors
  const notifiedVendorUserIds: string[] = [];

  if (event.servicesNeeded && Array.isArray(event.servicesNeeded)) {
    for (const service of event.servicesNeeded as string[]) {
      const eligibleVendors = await db.query.vendorProfiles.findMany({
        where: and(
          eq(vendorProfiles.category, service as "catering"),
          eq(vendorProfiles.status, "approved"),
        ),
        limit: 3,
      });

      for (const vendor of eligibleVendors) {
        await db.insert(quoteRequests).values({
          eventId: event.id,
          vendorId: vendor.id,
          category: service as "catering",
          status: "requested",
          expiresAt: quotesDeadline,
        });

        // Notify each vendor (de-duplicate if same vendor handles multiple categories)
        if (!notifiedVendorUserIds.includes(vendor.userId)) {
          notifiedVendorUserIds.push(vendor.userId);
          const vendorUser = await db.query.users.findFirst({ where: eq(users.id, vendor.userId) });
          if (vendorUser) {
            notify({
              userId: vendor.userId,
              type: "quote_requested",
              title: "New Quote Request",
              body: `A planner is looking for ${service} services for "${event.title}". Submit your quote before the 4-hour deadline.`,
              metadata: { eventId: event.id, service },
              emailTo: vendorUser.email,
            });
          }
        }
      }
    }
  }

  res.json(updated);
});

// GET /events/:eventId/quotes — quotes grouped by category
router.get("/events/:eventId/quotes", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;

  const quoteList = await db.query.quotes.findMany({
    where: eq(quotes.eventId, eventId),
    orderBy: quotes.totalAmount,
  });

  const quotesByCategory: Record<string, typeof quoteList> = {};
  for (const quote of quoteList) {
    if (!quotesByCategory[quote.category]) quotesByCategory[quote.category] = [];
    quotesByCategory[quote.category].push(quote);
  }

  res.json({ eventId, quotesByCategory });
});

export default router;
