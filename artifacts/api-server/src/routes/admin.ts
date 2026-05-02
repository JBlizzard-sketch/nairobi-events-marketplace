import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { vendorProfiles, users, events, bookings, quoteRequests } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

import { notify } from "../services/notify";

// ── In-memory platform settings (persists for server lifetime) ────────────────
let platformSettings = {
  platformFeePercent: 10,
  maintenanceMode: false,
  maintenanceMessage: "The platform is temporarily down for maintenance. We'll be back shortly.",
  updatedAt: new Date().toISOString(),
};

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

// ── GET /admin/users ──────────────────────────────────────────────────────────

router.get("/admin/users", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"))));
  const offset = (page - 1) * limit;
  const roleFilter = typeof req.query.role === "string" ? req.query.role : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase().trim() : undefined;

  const conditions = roleFilter ? [eq(users.role, roleFilter as any)] : [];

  const [allUsers, [{ count: total }]] = await Promise.all([
    db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (u, { desc }) => [desc(u.createdAt)],
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)` }).from(users).where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  // Filter by search in-memory (simple fullName/email match)
  const filtered = search
    ? allUsers.filter(u =>
        u.email.toLowerCase().includes(search) ||
        (u.fullName ?? "").toLowerCase().includes(search)
      )
    : allUsers;

  const enriched = await Promise.all(filtered.map(async u => {
    const [vp, [{ count: eventCount }], [{ count: bookingCount }]] = await Promise.all([
      u.role === "vendor" ? db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.userId, u.id) }) : Promise.resolve(null),
      db.select({ count: sql<number>`count(*)` }).from(events).where(eq(events.plannerId, u.id)),
      db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.plannerId, u.id)),
    ]);
    return {
      id: u.id,
      clerkId: u.clerkId,
      email: u.email,
      fullName: u.fullName ?? "",
      phone: u.phone ?? null,
      role: u.role,
      avatarUrl: u.avatarUrl ?? null,
      isActive: u.isActive,
      createdAt: u.createdAt,
      vendorStatus: vp?.status ?? null,
      vendorBusinessName: vp?.businessName ?? null,
      vendorCategory: vp?.category ?? null,
      eventCount: Number(eventCount ?? 0),
      bookingCount: Number(bookingCount ?? 0),
    };
  }));

  res.json({ users: enriched, total: Number(total ?? 0) });
});

// ── PATCH /admin/users/:userId ────────────────────────────────────────────────

router.patch("/admin/users/:userId", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const { userId } = req.params;
  const { role, isActive } = req.body as { role?: string; isActive?: boolean };

  const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!target) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  if (Object.keys(updates).length === 0) { res.json(target); return; }

  await db.update(users).set(updates as any).where(eq(users.id, userId));

  const updated = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const vp = updated?.role === "vendor"
    ? await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.userId, userId) })
    : null;
  const [[{ count: eventCount }], [{ count: bookingCount }]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(events).where(eq(events.plannerId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.plannerId, userId)),
  ]);

  res.json({
    id: updated!.id,
    clerkId: updated!.clerkId,
    email: updated!.email,
    fullName: updated!.fullName ?? "",
    phone: updated!.phone ?? null,
    role: updated!.role,
    avatarUrl: updated!.avatarUrl ?? null,
    isActive: updated!.isActive,
    createdAt: updated!.createdAt,
    vendorStatus: vp?.status ?? null,
    vendorBusinessName: vp?.businessName ?? null,
    vendorCategory: vp?.category ?? null,
    eventCount: Number(eventCount ?? 0),
    bookingCount: Number(bookingCount ?? 0),
  });
});

// ── GET /admin/events ─────────────────────────────────────────────────────────

router.get("/admin/events", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"))));
  const offset = (page - 1) * limit;
  const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;

  const conditions = statusFilter ? [eq(events.status, statusFilter as any)] : [];

  const [eventList, [{ count: total }]] = await Promise.all([
    db.query.events.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (ev, { desc }) => [desc(ev.createdAt)],
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)` }).from(events).where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  const enriched = await Promise.all(eventList.map(async ev => {
    const [planner, [{ count: quoteCount }], [{ count: bookingCount }]] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, ev.plannerId) }),
      db.select({ count: sql<number>`count(*)` }).from(quoteRequests).where(eq(quoteRequests.eventId, ev.id)),
      db.select({ count: sql<number>`count(*)` }).from(bookings).where(eq(bookings.eventId, ev.id)),
    ]);
    return {
      ...ev,
      plannerName: planner ? (planner.fullName?.trim() || planner.email) : null,
      plannerEmail: planner?.email ?? null,
      quoteCount: Number(quoteCount ?? 0),
      bookingCount: Number(bookingCount ?? 0),
    };
  }));

  res.json({ events: enriched, total: Number(total ?? 0) });
});

// ── GET /admin/bookings ───────────────────────────────────────────────────────

router.get("/admin/bookings", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const page = Math.max(1, parseInt(String(req.query.page ?? "1")));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "50"))));
  const offset = (page - 1) * limit;
  const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;

  const conditions = statusFilter ? [eq(bookings.status, statusFilter as any)] : [];

  const [bookingList, [{ count: total }]] = await Promise.all([
    db.query.bookings.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (b, { desc }) => [desc(b.createdAt)],
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)` }).from(bookings).where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

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

  res.json({ bookings: enriched, total: Number(total ?? 0) });
});

// ── PUT /admin/bookings/:bookingId/resolve — resolve a dispute ────────────────

router.put("/admin/bookings/:bookingId/resolve", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const { bookingId } = req.params;
  const body = req.body as { resolution: string; adminNotes?: string };

  if (!body.resolution || !["completed", "refunded"].includes(body.resolution)) {
    res.status(400).json({ error: "validation_error", message: "resolution must be 'completed' or 'refunded'" });
    return;
  }

  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  if (!booking) { res.status(404).json({ error: "not_found", message: "Booking not found" }); return; }
  if (booking.status !== "disputed") {
    res.status(400).json({ error: "invalid_state", message: "Only disputed bookings can be resolved" }); return;
  }

  const [updated] = await db
    .update(bookings)
    .set({
      status: body.resolution as "completed" | "refunded",
      cancellationReason: body.adminNotes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  // Notify both parties
  const [planner, vendor] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, booking.plannerId) }),
    db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.id, booking.vendorId) })
      .then(vp => vp ? db.query.users.findFirst({ where: eq(users.id, vp.userId) }) : null),
  ]);

  const resolutionLabel = body.resolution === "completed" ? "in favour of the vendor" : "as a refund to the planner";
  const message = `The dispute on booking #${bookingId.slice(0, 8).toUpperCase()} has been resolved ${resolutionLabel}.${body.adminNotes ? ` Admin note: ${body.adminNotes}` : ""}`;

  if (planner) {
    notify({ userId: planner.id, type: "booking_confirmed", title: "Dispute Resolved", body: message });
  }
  if (vendor) {
    notify({ userId: vendor.id, type: "payment_released", title: "Dispute Resolved", body: message });
  }

  res.json(updated);
});

// ── GET /admin/settings ───────────────────────────────────────────────────────

router.get("/admin/settings", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }
  res.json(platformSettings);
});

// ── PUT /admin/settings ───────────────────────────────────────────────────────

router.put("/admin/settings", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  const admin = await requireAdmin(clerkId);
  if (!admin) { res.status(403).json({ error: "forbidden", message: "Admin access required" }); return; }

  const body = req.body as { platformFeePercent?: number; maintenanceMode?: boolean; maintenanceMessage?: string };

  if (body.platformFeePercent !== undefined) {
    if (typeof body.platformFeePercent !== "number" || body.platformFeePercent < 0 || body.platformFeePercent > 50) {
      res.status(400).json({ error: "validation_error", message: "platformFeePercent must be between 0 and 50" }); return;
    }
    platformSettings.platformFeePercent = body.platformFeePercent;
  }
  if (body.maintenanceMode !== undefined) platformSettings.maintenanceMode = body.maintenanceMode;
  if (body.maintenanceMessage !== undefined) platformSettings.maintenanceMessage = body.maintenanceMessage;
  platformSettings.updatedAt = new Date().toISOString();

  res.json(platformSettings);
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
