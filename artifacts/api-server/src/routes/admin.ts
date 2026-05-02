import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vendorProfiles, users, events, bookings } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { notify } from "../services/notify";

const router: IRouter = Router();

async function requireAdmin(clerkId: string | undefined): Promise<{ id: string } | null> {
  if (!clerkId) return null;
  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user || user.role !== "admin") return null;
  return user;
}

// ── GET /admin/vendors — all vendors with optional status filter ───────────────

router.get("/admin/vendors", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const status = req.query.status as string | undefined;
  const limit = Number(req.query.limit ?? 50);

  const vendorList = await db.query.vendorProfiles.findMany({
    where: status ? eq(vendorProfiles.status, status as "approved") : undefined,
    orderBy: vendorProfiles.createdAt,
    limit,
  });

  // Enrich with user email
  const enriched = await Promise.all(
    vendorList.map(async (v) => {
      const user = await db.query.users.findFirst({ where: eq(users.id, v.userId) });
      return { ...v, userEmail: user?.email ?? null };
    }),
  );

  res.json(enriched);
});

// ── GET /admin/vendors/pending ────────────────────────────────────────────────

router.get("/admin/vendors/pending", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const pending = await db.query.vendorProfiles.findMany({
    where: eq(vendorProfiles.status, "pending_review"),
    orderBy: vendorProfiles.createdAt,
  });

  const enriched = await Promise.all(
    pending.map(async (v) => {
      const user = await db.query.users.findFirst({ where: eq(users.id, v.userId) });
      return { ...v, userEmail: user?.email ?? null };
    }),
  );

  res.json(enriched);
});

// ── POST /admin/vendors/:vendorId/approve ─────────────────────────────────────

router.post("/admin/vendors/:vendorId/approve", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;
  const note = (req.body as any)?.note ?? null;

  const [updated] = await db
    .update(vendorProfiles)
    .set({ status: "approved", adminNotes: note, updatedAt: new Date() })
    .where(eq(vendorProfiles.id, vendorId))
    .returning();

  if (!updated) { res.status(404).json({ error: "not_found", message: "Vendor not found" }); return; }

  // Notify vendor
  const vendorUser = await db.query.users.findFirst({ where: eq(users.id, updated.userId) });
  if (vendorUser) {
    notify({
      userId: vendorUser.id,
      type: "vendor_approved",
      title: "Application Approved!",
      body: `Congratulations! Your vendor profile for "${updated.businessName}" has been approved. You are now visible to planners and will start receiving quote requests.${note ? ` Admin note: ${note}` : ""}`,
      metadata: { vendorId: updated.id },
      emailTo: vendorUser.email,
    });
  }

  res.json(updated);
});

// ── POST /admin/vendors/:vendorId/reject ──────────────────────────────────────

router.post("/admin/vendors/:vendorId/reject", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;
  const reason: string = (req.body as any)?.reason ?? "";
  if (!reason.trim()) { res.status(400).json({ error: "validation_error", message: "reason is required" }); return; }

  const [updated] = await db
    .update(vendorProfiles)
    .set({ status: "rejected", adminNotes: reason, updatedAt: new Date() })
    .where(eq(vendorProfiles.id, vendorId))
    .returning();

  if (!updated) { res.status(404).json({ error: "not_found", message: "Vendor not found" }); return; }

  const vendorUser = await db.query.users.findFirst({ where: eq(users.id, updated.userId) });
  if (vendorUser) {
    notify({
      userId: vendorUser.id,
      type: "vendor_rejected",
      title: "Application Update",
      body: `Your vendor application for "${updated.businessName}" was not approved at this time. Reason: ${reason}. You can update your profile and resubmit.`,
      metadata: { vendorId: updated.id },
      emailTo: vendorUser.email,
    });
  }

  res.json(updated);
});

// ── POST /admin/vendors/:vendorId/suspend ─────────────────────────────────────

router.post("/admin/vendors/:vendorId/suspend", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;
  const reason: string = (req.body as any)?.reason ?? "";
  if (!reason.trim()) { res.status(400).json({ error: "validation_error", message: "reason is required" }); return; }

  const [updated] = await db
    .update(vendorProfiles)
    .set({ status: "suspended", adminNotes: reason, updatedAt: new Date() })
    .where(eq(vendorProfiles.id, vendorId))
    .returning();

  if (!updated) { res.status(404).json({ error: "not_found", message: "Vendor not found" }); return; }

  const vendorUser = await db.query.users.findFirst({ where: eq(users.id, updated.userId) });
  if (vendorUser) {
    notify({
      userId: vendorUser.id,
      type: "vendor_suspended",
      title: "Account Suspended",
      body: `Your vendor account "${updated.businessName}" has been suspended. Reason: ${reason}. Please contact support for further information.`,
      metadata: { vendorId: updated.id },
      emailTo: vendorUser.email,
    });
  }

  res.json(updated);
});

// ── GET /admin/stats ──────────────────────────────────────────────────────────

router.get("/admin/stats", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const [
    totalUsersResult,
    totalVendorsResult,
    pendingVendorsResult,
    approvedVendorsResult,
    rejectedVendorsResult,
    totalEventsResult,
    totalBookingsResult,
    revenueResult,
    activeEventsResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(vendorProfiles),
    db.select({ count: sql<number>`count(*)` }).from(vendorProfiles).where(eq(vendorProfiles.status, "pending_review")),
    db.select({ count: sql<number>`count(*)` }).from(vendorProfiles).where(eq(vendorProfiles.status, "approved")),
    db.select({ count: sql<number>`count(*)` }).from(vendorProfiles).where(eq(vendorProfiles.status, "rejected")),
    db.select({ count: sql<number>`count(*)` }).from(events),
    db.select({ count: sql<number>`count(*)` }).from(bookings),
    db.select({ total: sql<string>`coalesce(sum(platform_fee_amount), 0)` }).from(bookings).where(eq(bookings.status, "completed")),
    db.select({ count: sql<number>`count(*)` }).from(events).where(eq(events.status, "quotes_requested")),
  ]);

  res.json({
    totalUsers: Number(totalUsersResult[0]?.count ?? 0),
    totalVendors: Number(totalVendorsResult[0]?.count ?? 0),
    pendingVendors: Number(pendingVendorsResult[0]?.count ?? 0),
    approvedVendors: Number(approvedVendorsResult[0]?.count ?? 0),
    rejectedVendors: Number(rejectedVendorsResult[0]?.count ?? 0),
    totalEvents: Number(totalEventsResult[0]?.count ?? 0),
    totalBookings: Number(totalBookingsResult[0]?.count ?? 0),
    totalRevenue: revenueResult[0]?.total ?? "0",
    activeEvents: Number(activeEventsResult[0]?.count ?? 0),
  });
});

export default router;
