import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vendorProfiles, users, events, bookings } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { AdminSuspendVendorBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Simple admin guard (check user role)
async function requireAdmin(clerkId: string | undefined): Promise<{ id: string } | null> {
  if (!clerkId) return null;
  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET /admin/vendors/pending
router.get("/admin/vendors/pending", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) {
    res.status(403).json({ error: "forbidden", message: "Admin access required" });
    return;
  }

  const pending = await db.query.vendorProfiles.findMany({
    where: eq(vendorProfiles.status, "pending_review"),
    orderBy: vendorProfiles.createdAt,
  });

  res.json(pending);
});

// POST /admin/vendors/:vendorId/approve
router.post("/admin/vendors/:vendorId/approve", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) {
    res.status(403).json({ error: "forbidden", message: "Admin access required" });
    return;
  }

  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;

  const [updated] = await db
    .update(vendorProfiles)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(vendorProfiles.id, vendorId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Vendor not found" });
    return;
  }

  res.json(updated);
});

// POST /admin/vendors/:vendorId/suspend
router.post("/admin/vendors/:vendorId/suspend", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) {
    res.status(403).json({ error: "forbidden", message: "Admin access required" });
    return;
  }

  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;

  const parsed = AdminSuspendVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(vendorProfiles)
    .set({ status: "suspended", adminNotes: parsed.data.reason, updatedAt: new Date() })
    .where(eq(vendorProfiles.id, vendorId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Vendor not found" });
    return;
  }

  res.json(updated);
});

// GET /admin/stats
router.get("/admin/stats", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) {
    res.status(403).json({ error: "forbidden", message: "Admin access required" });
    return;
  }

  const [
    totalUsersResult,
    totalVendorsResult,
    pendingVendorsResult,
    totalEventsResult,
    totalBookingsResult,
    revenueResult,
    activeEventsResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(vendorProfiles),
    db
      .select({ count: sql<number>`count(*)` })
      .from(vendorProfiles)
      .where(eq(vendorProfiles.status, "pending_review")),
    db.select({ count: sql<number>`count(*)` }).from(events),
    db.select({ count: sql<number>`count(*)` }).from(bookings),
    db
      .select({ total: sql<string>`coalesce(sum(platform_fee_amount), 0)` })
      .from(bookings)
      .where(eq(bookings.status, "completed")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.status, "quotes_requested")),
  ]);

  res.json({
    totalUsers: Number(totalUsersResult[0]?.count ?? 0),
    totalVendors: Number(totalVendorsResult[0]?.count ?? 0),
    pendingVendors: Number(pendingVendorsResult[0]?.count ?? 0),
    totalEvents: Number(totalEventsResult[0]?.count ?? 0),
    totalBookings: Number(totalBookingsResult[0]?.count ?? 0),
    totalRevenue: revenueResult[0]?.total ?? "0",
    activeEvents: Number(activeEventsResult[0]?.count ?? 0),
  });
});

export default router;
