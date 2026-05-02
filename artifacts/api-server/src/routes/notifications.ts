import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notifications, users } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { ListNotificationsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /notifications
router.get("/notifications", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Missing x-clerk-user-id header" });
    return;
  }

  const parsed = ListNotificationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const { isRead, limit = 20 } = parsed.data;
  const conditions = [eq(notifications.userId, user.id)];
  if (isRead !== undefined) conditions.push(eq(notifications.isRead, isRead));

  const notifList = await db.query.notifications.findMany({
    where: and(...conditions),
    orderBy: desc(notifications.createdAt),
    limit,
  });

  const unreadCount = await db.query.notifications.findMany({
    where: and(eq(notifications.userId, user.id), eq(notifications.isRead, false)),
  });

  res.json({ notifications: notifList, unreadCount: unreadCount.length });
});

// PATCH /notifications/:notificationId/read
router.patch("/notifications/:notificationId/read", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Missing x-clerk-user-id header" });
    return;
  }

  const notifId = Array.isArray(req.params.notificationId)
    ? req.params.notificationId[0]
    : req.params.notificationId;

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const [updated] = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.id, notifId), eq(notifications.userId, user.id)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Notification not found" });
    return;
  }

  res.json(updated);
});

// POST /notifications/read-all
router.post("/notifications/read-all", async (req, res): Promise<void> => {
  const clerkId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Missing x-clerk-user-id header" });
    return;
  }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const result = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)))
    .returning();

  res.json({ count: result.length });
});

export default router;
