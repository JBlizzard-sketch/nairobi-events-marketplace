import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { reviews, bookings, vendorProfiles, users } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateReviewBody } from "@workspace/api-zod";
import { notify } from "../services/notify";

const router: IRouter = Router();

// POST /reviews
router.post("/reviews", async (req, res): Promise<void> => {
  const clerkId = getAuth(req)?.userId ?? undefined;
  if (!clerkId) { res.status(401).json({ error: "unauthorized", message: "Authentication required" }); return; }

  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "validation_error", message: parsed.error.message }); return; }

  const user = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  if (!user) { res.status(404).json({ error: "not_found", message: "User not found" }); return; }

  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.id, parsed.data.bookingId), eq(bookings.plannerId, user.id)),
  });
  if (!booking) { res.status(404).json({ error: "not_found", message: "Booking not found" }); return; }

  if (booking.status !== "completed" && !parsed.data.isNoShow) {
    res.status(400).json({ error: "invalid_state", message: "Can only review completed bookings" }); return;
  }

  const existing = await db.query.reviews.findFirst({
    where: and(eq(reviews.bookingId, parsed.data.bookingId), eq(reviews.reviewerId, user.id)),
  });
  if (existing) { res.status(409).json({ error: "conflict", message: "Review already submitted" }); return; }

  const [created] = await db
    .insert(reviews)
    .values({ ...parsed.data, vendorId: booking.vendorId, reviewerId: user.id })
    .returning();

  // Update vendor average rating
  const allReviews = await db.query.reviews.findMany({ where: eq(reviews.vendorId, booking.vendorId) });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  const noShowCount = allReviews.filter((r) => r.isNoShow).length;

  await db
    .update(vendorProfiles)
    .set({
      averageRating: String(Math.round(avgRating * 100) / 100),
      totalReviews: allReviews.length,
      noShowCount,
      status: noShowCount >= 3 || avgRating < 2 ? "suspended" : undefined,
      updatedAt: new Date(),
    })
    .where(eq(vendorProfiles.id, booking.vendorId));

  // Notify the vendor that a review was submitted
  const vendor = await db.query.vendorProfiles.findFirst({ where: eq(vendorProfiles.id, booking.vendorId) });
  if (vendor) {
    const vendorUser = await db.query.users.findFirst({ where: eq(users.id, vendor.userId) });
    if (vendorUser) {
      const stars = "★".repeat(parsed.data.rating) + "☆".repeat(5 - parsed.data.rating);
      notify({
        userId: vendorUser.id,
        type: "review_reminder",
        title: "New Review Posted",
        body: `You received a ${stars} (${parsed.data.rating}/5) review. ${parsed.data.comment ? `"${parsed.data.comment}"` : ""}`,
        metadata: { reviewId: created.id, bookingId: booking.id },
        emailTo: vendorUser.email,
      });
    }
  }

  res.status(201).json(created);
});

export default router;
