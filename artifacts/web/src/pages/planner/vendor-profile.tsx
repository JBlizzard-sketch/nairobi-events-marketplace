import { useParams } from "wouter";
import { useGetVendor, useGetVendorReviews, useGetVendorAvailability } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Star, Award, MapPin, Globe, Instagram } from "lucide-react";

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="ml-1.5 text-sm font-medium">{value.toFixed(1)}</span>
    </div>
  );
}

export default function VendorProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: vendor, isLoading } = useGetVendor(id ?? "");
  const { data: reviewsData } = useGetVendorReviews(id ?? "", { page: 1, limit: 5 });

  // Availability for next 60 days
  const fromDate = new Date().toISOString().split("T")[0];
  const toDate = new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0];
  const { data: availability } = useGetVendorAvailability(id ?? "", { from: fromDate, to: toDate });

  if (isLoading) {
    return (
      <div className="space-y-6">
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{v.businessName}</h1>
            {v.isPremium && <Award className="h-6 w-6 text-amber-500" />}
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <Badge variant="secondary" className="capitalize">{v.category.replace(/_/g, " ")}</Badge>
            {v.city && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />{v.city}
              </span>
            )}
            {v.averageRating > 0 && <StarRating value={Number(v.averageRating)} />}
          </div>
        </div>
        <div className="flex gap-3">
          {v.websiteUrl && (
            <a href={v.websiteUrl} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-muted/50">
                <Globe className="h-3.5 w-3.5" /> Website
              </Badge>
            </a>
          )}
          {v.instagramHandle && (
            <a href={`https://instagram.com/${v.instagramHandle}`} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-muted/50">
                <Instagram className="h-3.5 w-3.5" /> @{v.instagramHandle}
              </Badge>
            </a>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Total Bookings", value: v.totalBookings ?? 0 },
          { label: "Total Reviews", value: v.totalReviews ?? 0 },
          { label: "Average Rating", value: v.averageRating > 0 ? `${Number(v.averageRating).toFixed(1)} / 5.0` : "No reviews yet" },
        ].map(({ label, value }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {v.description && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>About</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{v.description}</p>
          </CardContent>
        </Card>
      )}

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

      {v.serviceAreas && v.serviceAreas.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Service Areas</p>
          <div className="flex flex-wrap gap-2">
            {v.serviceAreas.map((area: string) => (
              <Badge key={area} variant="outline">{area}</Badge>
            ))}
          </div>
        </div>
      )}

      {availability && (availability as any[]).length > 0 && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Availability (Next 60 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(availability as any[]).filter(a => !a.isAvailable).slice(0, 20).map((a: any) => (
                <Badge key={a.date} variant="destructive" className="font-normal text-xs">
                  Booked: {new Date(a.date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                </Badge>
              ))}
              {(availability as any[]).filter(a => !a.isAvailable).length === 0 && (
                <p className="text-sm text-muted-foreground">All dates available in the next 60 days</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div>
        <h2 className="text-xl font-bold mb-4">Reviews ({(reviewsData as any)?.total ?? 0})</h2>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r: any) => (
              <Card key={r.id} className="shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating value={r.rating} />
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(r.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span>Quality: {r.qualityRating}/5</span>
                    <span>Punctuality: {r.punctualityRating}/5</span>
                    <span>Value: {r.valueRating}/5</span>
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
