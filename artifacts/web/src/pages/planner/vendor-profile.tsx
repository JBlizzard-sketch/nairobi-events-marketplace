import { useParams } from "wouter";
import { useGetVendor, useGetVendorReviews, useGetVendorAvailability } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Star, Award, MapPin, Globe, Instagram, ShieldCheck, Briefcase, MessageSquare } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function StarRow({ label, value }: { label: string; value: number }) {
  const r = Math.round(Math.min(Math.max(value, 0), 5));
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground w-24">{label}</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i < r ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
          />
        ))}
        <span className="ml-1.5 text-xs font-semibold text-muted-foreground">{Number(value).toFixed(1)}</span>
      </div>
    </div>
  );
}

function OverallStars({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const r = Math.round(Math.min(Math.max(value, 0), 5));
  const cls = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < r ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"}`}
        />
      ))}
      <span className={`ml-1 font-semibold ${size === "lg" ? "text-xl" : size === "sm" ? "text-xs" : "text-base"}`}>
        {Number(value).toFixed(1)}
      </span>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VendorProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: vendor, isLoading } = useGetVendor(id ?? "");
  const { data: reviewsData } = useGetVendorReviews(id ?? "", { page: 1, limit: 10 });

  const fromDate = new Date().toISOString().split("T")[0];
  const toDate = new Date(Date.now() + 60 * 86_400_000).toISOString().split("T")[0];
  const { data: availability } = useGetVendorAvailability(id ?? "", { from: fromDate, to: toDate });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!vendor) {
    return <div className="p-8 text-center text-muted-foreground">Vendor not found.</div>;
  }

  const v = vendor as any;
  const reviews = (reviewsData as any)?.reviews ?? [];
  const totalReviews = (reviewsData as any)?.total ?? 0;

  // Compute aggregate sub-ratings from reviews for the summary bar
  const avgQuality = reviews.length
    ? reviews.reduce((s: number, r: any) => s + Number(r.qualityRating ?? 0), 0) / reviews.length
    : 0;
  const avgPunctuality = reviews.length
    ? reviews.reduce((s: number, r: any) => s + Number(r.punctualityRating ?? 0), 0) / reviews.length
    : 0;
  const avgValue = reviews.length
    ? reviews.reduce((s: number, r: any) => s + Number(r.valueRating ?? 0), 0) / reviews.length
    : 0;

  const bookedDates = (availability as any[] ?? []).filter(a => !a.isAvailable);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{v.businessName}</h1>
            {v.isPremium && (
              <Badge className="gap-1 bg-amber-100 text-amber-800 border-amber-200">
                <Award className="h-3.5 w-3.5" /> Premium
              </Badge>
            )}
            <Badge className="gap-1 bg-emerald-100 text-emerald-800 border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </Badge>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <Badge variant="secondary" className="capitalize">{v.category.replace(/_/g, " ")}</Badge>
            {v.city && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />{v.city}
              </span>
            )}
            {v.averageRating > 0 && <OverallStars value={Number(v.averageRating)} size="md" />}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {v.websiteUrl && (
            <a href={v.websiteUrl} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-muted/50 py-1.5">
                <Globe className="h-3.5 w-3.5" /> Website
              </Badge>
            </a>
          )}
          {v.instagramHandle && (
            <a href={`https://instagram.com/${v.instagramHandle}`} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-muted/50 py-1.5">
                <Instagram className="h-3.5 w-3.5" /> @{v.instagramHandle}
              </Badge>
            </a>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl flex-shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Events Done</p>
              <p className="text-2xl font-bold mt-0.5">{v.totalBookings ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="bg-amber-50 p-2.5 rounded-xl flex-shrink-0">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Rating</p>
              <p className="text-2xl font-bold mt-0.5">
                {v.averageRating > 0 ? Number(v.averageRating).toFixed(1) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="bg-violet-50 p-2.5 rounded-xl flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reviews</p>
              <p className="text-2xl font-bold mt-0.5">{totalReviews}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About */}
      {v.description && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>About</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{v.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Portfolio */}
      {v.portfolioUrls && v.portfolioUrls.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Portfolio</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {v.portfolioUrls.map((url: string, i: number) => (
                <div key={i} className="aspect-video rounded-lg bg-muted overflow-hidden">
                  <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service areas */}
      {v.serviceAreas && v.serviceAreas.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Service Areas</p>
          <div className="flex flex-wrap gap-2">
            {v.serviceAreas.map((area: string) => (
              <Badge key={area} variant="outline">{area}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      {(availability as any[] ?? []).length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Availability (Next 60 Days)</CardTitle></CardHeader>
          <CardContent>
            {bookedDates.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                All dates available in the next 60 days
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bookedDates.slice(0, 24).map((a: any) => (
                  <Badge key={a.date} variant="destructive" className="font-normal text-xs">
                    Booked: {new Date(a.date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Reviews section */}
      <div>
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="text-xl font-bold">Reviews</h2>
          <span className="text-muted-foreground text-sm">{totalReviews} total</span>
        </div>

        {/* Aggregate rating breakdown */}
        {reviews.length > 0 && v.averageRating > 0 && (
          <Card className="shadow-sm mb-6">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-5xl font-black text-primary">{Number(v.averageRating).toFixed(1)}</p>
                  <OverallStars value={Number(v.averageRating)} size="sm" />
                  <p className="text-xs text-muted-foreground mt-1">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex-1 min-w-48 space-y-2">
                  {avgQuality > 0 && <StarRow label="Quality" value={avgQuality} />}
                  {avgPunctuality > 0 && <StarRow label="Punctuality" value={avgPunctuality} />}
                  {avgValue > 0 && <StarRow label="Value" value={avgValue} />}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r: any) => (
              <Card key={r.id} className="shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div>
                      <OverallStars value={Number(r.rating)} size="sm" />
                      {r.plannerName && (
                        <p className="text-xs text-muted-foreground mt-1">{r.plannerName}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(r.createdAt)}</span>
                  </div>

                  {r.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{r.comment}</p>
                  )}

                  {/* Sub-rating stars */}
                  <div className="space-y-1.5 border-t border-border/40 pt-3">
                    {r.qualityRating > 0 && <StarRow label="Quality" value={Number(r.qualityRating)} />}
                    {r.punctualityRating > 0 && <StarRow label="Punctuality" value={Number(r.punctualityRating)} />}
                    {r.valueRating > 0 && <StarRow label="Value" value={Number(r.valueRating)} />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
