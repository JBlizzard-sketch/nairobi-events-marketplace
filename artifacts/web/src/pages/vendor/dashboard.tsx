import { Link } from "wouter";
import { useListMyQuoteRequests, useListMyBookings, useGetMyVendorProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ChevronRight, Star, Briefcase, Clock } from "lucide-react";

export default function VendorDashboard() {
  const { data: profile, isLoading: loadingProfile } = useGetMyVendorProfile();
  const { data: requests, isLoading: loadingRequests } = useListMyQuoteRequests({ status: "requested" as any });
  const { data: bookings, isLoading: loadingBookings } = useListMyBookings({});

  const profile_ = profile as any;
  const pendingRequests = (Array.isArray(requests) ? requests : []).filter((r: any) => r.status === "requested");
  const activeBookings = (Array.isArray(bookings) ? bookings : []).filter((b: any) => ["in_escrow", "confirmed"].includes(b.status));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {loadingProfile ? <Skeleton className="h-8 w-48 inline-block" /> : profile_?.businessName ?? "Vendor Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {loadingProfile ? "" : (
              <span className="flex items-center gap-2">
                {profile_?.status === "approved"
                  ? <Badge variant="secondary" className="text-xs">Approved</Badge>
                  : <Badge variant="destructive" className="text-xs capitalize">{profile_?.status?.replace(/_/g, " ") ?? "Pending"}</Badge>
                }
                {profile_?.averageRating > 0 && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {Number(profile_?.averageRating).toFixed(1)} · {profile_?.totalReviews} reviews
                  </span>
                )}
              </span>
            )}
          </p>
        </div>
        <Link href="/vendor/requests">
          <Button className="font-semibold shadow-sm gap-2">
            <FileText className="h-4 w-4" />
            View All Requests
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Pending Requests</CardDescription>
            <CardTitle className="text-4xl text-primary">
              {loadingRequests ? <Skeleton className="h-10 w-16" /> : pendingRequests.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Awaiting your quote</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Active Bookings</CardDescription>
            <CardTitle className="text-4xl text-foreground">
              {loadingBookings ? <Skeleton className="h-10 w-16" /> : activeBookings.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">In progress</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Total Bookings</CardDescription>
            <CardTitle className="text-4xl text-foreground">
              {loadingProfile ? <Skeleton className="h-10 w-16" /> : profile_?.totalBookings ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">All time</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>New Quote Requests</CardTitle>
              <CardDescription>Events waiting for your price</CardDescription>
            </div>
            <Link href="/vendor/requests">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingRequests ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Clock className="h-8 w-8 text-muted-foreground mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No pending requests right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 4).map((req: any) => (
                  <Link key={req.id} href="/vendor/requests">
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all group">
                      <div>
                        <p className="font-medium text-sm group-hover:text-primary">{req.event?.title ?? "Event"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{req.category?.replace(/_/g, " ")} · {new Date(req.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Bookings</CardTitle>
              <CardDescription>Confirmed events you're working</CardDescription>
            </div>
            <Link href="/vendor/requests">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingBookings ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : activeBookings.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Briefcase className="h-8 w-8 text-muted-foreground mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No active bookings</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBookings.slice(0, 4).map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">#{b.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">KES {Number(b.totalAmount).toLocaleString()}</p>
                    </div>
                    <Badge variant="default" className="capitalize text-xs">
                      {b.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
