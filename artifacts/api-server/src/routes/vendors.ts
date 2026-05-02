import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  vendorProfiles,
  vendorAvailability,
  reviews,
  users,
} from "@workspace/db";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import {
  ListVendorsQueryParams,
  CreateVendorProfileBody,
  UpdateVendorProfileBody,
  GetVendorAvailabilityQueryParams,
  SetMyAvailabilityBody,
  GetVendorReviewsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /vendors — list approved vendors with filters
router.get("/vendors", async (req, res): Promise<void> => {
  const parsed = ListVendorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { category, city, isPremium, minRating, page = 1, limit = 20 } = parsed.data;

  const conditions = [eq(vendorProfiles.status, "approved")];
  if (category) conditions.push(eq(vendorProfiles.category, category));
  if (city) conditions.push(eq(vendorProfiles.city, city));
  if (isPremium) conditions.push(eq(vendorProfiles.isPremium, true));
  if (minRating) conditions.push(gte(vendorProfiles.averageRating, String(minRating)));

  const offset = (page - 1) * limit;

  const [vendorList, countResult] = await Promise.all([
    db.query.vendorProfiles.findMany({
      where: and(...conditions),
      orderBy: [desc(vendorProfiles.isPremium), desc(vendorProfiles.averageRating)],
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)` }).from(vendorProfiles).where(and(...conditions)),
  ]);

  res.json({
    vendors: vendorList,
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit,
  });
});

// GET /vendors/me — get own vendor profile
router.get("/vendors/me", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
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

  res.json(vendor);
});

// POST /vendors/me — create vendor profile
router.post("/vendors/me", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }

  const parsed = CreateVendorProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const existing = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.userId, user.id),
  });
  if (existing) {
    res.status(409).json({ error: "conflict", message: "Vendor profile already exists" });
    return;
  }

  const [created] = await db
    .insert(vendorProfiles)
    .values({ ...parsed.data, userId: user.id, status: "pending_review" })
    .returning();

  res.status(201).json(created);
});

// PATCH /vendors/me — update own vendor profile
router.patch("/vendors/me", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }

  const parsed = UpdateVendorProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const [updated] = await db
    .update(vendorProfiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(vendorProfiles.userId, user.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Vendor profile not found" });
    return;
  }

  res.json(updated);
});

// GET /vendors/:vendorId — public vendor profile
router.get("/vendors/:vendorId", async (req, res): Promise<void> => {
  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;

  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, vendorId),
  });

  if (!vendor) {
    res.status(404).json({ error: "not_found", message: "Vendor not found" });
    return;
  }

  res.json(vendor);
});

// GET /vendors/:vendorId/availability
router.get("/vendors/:vendorId/availability", async (req, res): Promise<void> => {
  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;

  const parsed = GetVendorAvailabilityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { from, to } = parsed.data;

  const fromStr = from instanceof Date ? from.toISOString().split("T")[0] : String(from);
  const toStr = to instanceof Date ? to.toISOString().split("T")[0] : String(to);

  const records = await db.query.vendorAvailability.findMany({
    where: and(
      eq(vendorAvailability.vendorId, vendorId),
      sql`${vendorAvailability.date} >= ${fromStr}`,
      sql`${vendorAvailability.date} <= ${toStr}`,
    ),
    orderBy: vendorAvailability.date,
  });

  res.json(records);
});

// PUT /vendors/me/availability
router.put("/vendors/me/availability", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }

  const parsed = SetMyAvailabilityBody.safeParse(req.body);
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

  const results = await Promise.all(
    parsed.data.dates.map(async ({ date, isAvailable, note }) => {
      const dateStr = date instanceof Date ? (date as Date).toISOString().split("T")[0] : String(date);
      const existing = await db.query.vendorAvailability.findFirst({
        where: and(eq(vendorAvailability.vendorId, vendor.id), eq(vendorAvailability.date, dateStr)),
      });

      if (existing) {
        const [updated] = await db
          .update(vendorAvailability)
          .set({ isAvailable, note: note ?? null })
          .where(eq(vendorAvailability.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await db
        .insert(vendorAvailability)
        .values({ vendorId: vendor.id, date: dateStr, isAvailable, note: note ?? null })
        .returning();
      return created;
    }),
  );

  res.json(results);
});

// GET /vendors/:vendorId/reviews
router.get("/vendors/:vendorId/reviews", async (req, res): Promise<void> => {
  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;

  const parsed = GetVendorReviewsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { page = 1, limit = 10 } = parsed.data;
  const offset = (page - 1) * limit;

  const [reviewList, countResult, avgResult] = await Promise.all([
    db.query.reviews.findMany({
      where: and(eq(reviews.vendorId, vendorId), eq(reviews.isPublic, true)),
      orderBy: desc(reviews.createdAt),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(and(eq(reviews.vendorId, vendorId), eq(reviews.isPublic, true))),
    db
      .select({ avg: sql<number>`avg(${reviews.rating})` })
      .from(reviews)
      .where(and(eq(reviews.vendorId, vendorId), eq(reviews.isPublic, true))),
  ]);

  res.json({
    reviews: reviewList,
    total: Number(countResult[0]?.count ?? 0),
    averageRating: Number(avgResult[0]?.avg ?? 0),
  });
});

export default router;
