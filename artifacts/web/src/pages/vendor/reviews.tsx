import { useState } from "react";
import { useGetMyVendorProfile, useGetVendorReviews } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Star, AlertTriangle, MessageSquare, ThumbsUp } from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4.5 w-4.5 h-5 w-5" : "h-3.5 w-3.5";
  const filled = Math.round(Math.min(Math.max(value, 0), 5));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"}`}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number | null | undefined }) {
  if (!value) return null;
  const pct = Math.round((Number(value) / 5) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium w-6 text-right">{Number(value).toFixed(1)}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  const date = new Date(review.createdAt).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card className={`shadow-sm ${review.isNoShow ? "border-red-200 bg-red-50/30 dark:border-red-900/50 dark:bg-red-950/10" : "border-border"}`}>
      <CardContent className="p-5 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Stars value={review.rating} size="md" />
              <span className="font-semibold text-sm">{Number(review.rating).toFixed(1)}</span>
              {review.isNoShow && (
                <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50 gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  No-show reported
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
              #{(review.bookingId ?? "").slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Sub-ratings */}
        {(review.qualityRating || review.punctualityRating || review.valueRating) && (
          <div className="space-y-1.5 py-1">
            <RatingBar label="Quality" value={review.qualityRating} />
            <RatingBar label="Punctuality" value={review.punctualityRating} />
            <RatingBar label="Value" value={review.valueRating} />
          </div>
        )}

        {/* Comment */}
        {review.comment && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
            <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
            <p className="leading-relaxed">{review.comment}</p>
          </div>
        )}

        {/* Vendor reply */}
        {review.vendorReply && (
          <div className="flex items-start gap-2 text-sm border-l-2 border-primary pl-3">
            <ThumbsUp className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-semibold text-primary mb-0.5">Your reply</p>
              <p className="text-muted-foreground">{review.vendorReply}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VendorReviews() {
  const [starFilter, setStarFilter] = useState<number | null>(null);

  const { data: profileRaw, isLoading: profileLoading } = useGetMyVendorProfile();
  const profile = profileRaw as any;

  useDocumentTitle("My Reviews");
  const { data: reviewsRaw, isLoading: reviewsLoading, isError: reviewsError } = useGetVendorReviews(
    profile?.id ?? "",
    { page: 1, limit: 50 },
    { query: { enabled: !!profile?.id } as any },
  );

  const reviewsData = reviewsRaw as any;
  const reviews: any[] = reviewsData?.reviews ?? [];
  const total: number = reviewsData?.total ?? 0;
  const avgRating: number = Number(reviewsData?.averageRating ?? profile?.averageRating ?? 0);

  const isLoading = profileLoading || reviewsLoading;

  // Breakdown by star
  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  const noShowCount = reviews.filter((r) => r.isNoShow).length;

  const filteredReviews = starFilter === null
    ? reviews
    : reviews.filter((r) => Math.round(r.rating) === starFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Reviews</h1>
        <p className="text-muted-foreground mt-1">
          Ratings and feedback from event planners
        </p>
      </div>

      {reviewsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to load reviews — please refresh the page.</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : total === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-20 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Reviews from planners will appear here after completed bookings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary card */}
          <div className="grid gap-5 sm:grid-cols-3">
            <Card className="shadow-sm sm:col-span-1">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <div className="text-5xl font-bold tracking-tight text-primary">
                  {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                </div>
                <Stars value={avgRating} size="md" />
                <p className="text-sm text-muted-foreground">{total} review{total !== 1 ? "s" : ""}</p>
                {noShowCount > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50 gap-1 text-xs mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    {noShowCount} no-show{noShowCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm sm:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Rating Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pb-5">
                {starCounts.map(({ star, count }) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5 w-20 shrink-0">
                        {Array.from({ length: star }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Individual reviews */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold">
                {starFilter === null ? "All Reviews" : `${starFilter}-Star Reviews`}
                {starFilter !== null && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredReviews.length})
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  size="sm"
                  variant={starFilter === null ? "default" : "outline"}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setStarFilter(null)}
                >
                  All
                </Button>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = starCounts.find(s => s.star === star)?.count ?? 0;
                  return (
                    <Button
                      key={star}
                      size="sm"
                      variant={starFilter === star ? "default" : "outline"}
                      className="h-7 text-xs px-2.5 gap-1"
                      onClick={() => setStarFilter(starFilter === star ? null : star)}
                      disabled={count === 0}
                    >
                      <Star className={`h-3 w-3 ${starFilter === star ? "fill-white text-white" : "fill-amber-400 text-amber-400"}`} />
                      {star}
                      {count > 0 && (
                        <span className={`${starFilter === star ? "text-white/70" : "text-muted-foreground"}`}>
                          ({count})
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>
            {filteredReviews.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm border rounded-xl border-dashed">
                No {starFilter}-star reviews yet.
              </div>
            ) : filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
