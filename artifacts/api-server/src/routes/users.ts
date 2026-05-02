import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateMeBody } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /users/me
router.get("/users/me", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  res.json(user);
});

// PATCH /users/me
router.patch("/users/me", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }

  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(users)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(users.clerkId, clerkId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  res.json(updated);
});

// POST /users/sync — upsert user (called after Clerk sign-up/sign-in)
// clerkId comes from the authenticated session, NOT the request body
router.post("/users/sync", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }

  const { email, fullName, role, avatarUrl } = req.body as {
    email: string;
    fullName: string;
    role?: "planner" | "vendor";
    avatarUrl?: string;
  };

  if (!email || !fullName) {
    res.status(400).json({ error: "validation_error", message: "email and fullName are required" });
    return;
  }

  const existing = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({ email, fullName, avatarUrl: avatarUrl ?? existing.avatarUrl, updatedAt: new Date() })
      .where(eq(users.clerkId, clerkId))
      .returning();
    res.json(updated);
    return;
  }

  const [created] = await db
    .insert(users)
    .values({ clerkId, email, fullName, role: role ?? "planner", avatarUrl })
    .returning();

  res.status(201).json(created);
});

export default router;
