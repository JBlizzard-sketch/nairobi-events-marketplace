import { Link } from "wouter";
import { useListMyQuoteRequests, useListMyBookings, useGetMyVendorProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileText, ChevronRight, Star, Briefcase, Clock,
  Clock3, AlertTriangle, XCircle, PauseCircle, CheckCircle2,
} from "lucide-react";

function VettingBanner({ profile }: { profile: any }) {
  if (!profile) return null;

  if (profile.status === "pending_review") {
    return (
      <Alert className="border-amber-300 bg-amber-50 text-amber-900">
        <Clock3 className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 font-semibold">Profile Under Review</AlertTitle>
        <AlertDescription className="text-amber-700">
          Your vendor application is being reviewed by our team. This typically takes 1–2 business days.
          You'll receive a notification as soon as a decision is made.
        </AlertDescription>
      </Alert>
    );
  }

  if (profile.status === "rejected") {
    return (
      <Alert className="border-red-300 bg-red-50 text-red-900">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 font-semibold">Application Not Approved</AlertTitle>
        <AlertDescription className="text-red-700 space-y-3">
          <p>
            {profile.adminNotes
              ? <>Reason: <span className="font-medium">{profile.adminNotes}</span></>
              : "Your application was not approved at this time."}
          </p>
          <p>You can update your profile and resubmit for review.</p>
          <Link href="/vendor/profile">
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 mt-1">
              Update Profile &amp; Resubmit
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (profile.status === "suspended") {
    return (
      <Alert className="border-slate-300 bg-slate-50 text-slate-900">
        <PauseCircle className="h-4 w-4 text-slate-600" />
        <AlertTitle className="text-slate-800 font-semibold">Account Suspended</AlertTitle>
        <AlertDescription className="text-slate-700">
          {profile.adminNotes
            ? <>Reason: <span className="font-medium">{profile.adminNotes}</span>. </>
            : ""}
          Please contact support for assistance.
        </AlertDescription>
      </Alert>
    );
  }

  if (!profile.businessName) {
    return (
      <Alert className="border-primary/30 bg-primary/5">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <AlertTitle className="font-semibold">Complete Your Profile</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Set up your vendor profile and submit it for review to start receiving event quote requests.</p>
          <Link href="/vendor/profile">
            <Button size="sm" className="mt-1">Set Up Profile</Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

export default function VendorDashboard() {
  const { data: profile, isLoading: loadingProfile } = useGetMyVendorProfile();
  const { data: requests, isLoading: loadingRequests } = useListMyQuoteRequests({ status: "requested" as any });
  const { data: bookings, isLoading: loadingBookings } = useListMyBookings({});

  const profile_ = profile as any;
  const pendingRequests = (Array.isArray(requests) ? requests : []).filter((r: any) => r.status === "requested");
  const activeBookings = (Array.isArray(bookings) ? bookings : []).filter((b: any) => ["in_escrow", "confirmed"].includes(b.status));

  const isApproved = profile_?.status === "approved";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {loadingProfile ? <Skeleton className="h-8 w-48 inline-block" /> : profile_?.businessName ?? "Vendor Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {loadingProfile ? "" : (
              <span className="flex items-center gap-2 flex-wrap">
                {profile_?.status === "approved" ? (
                  <Badge variant="secondary" className="text-xs gap-1 bg-emerald-100 text-emerald-800 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Approved Vendor
                  </Badge>
                ) : profile_?.status ? (
                  <Badge variant="outline" className="text-xs capitalize">
                    {profile_?.status?.replace(/_/g, " ")}
                  </Badge>
                ) : null}
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
        {isApproved && (
          <Link href="/vendor/requests">
            <Button className="font-semibold shadow-sm gap-2">
              <FileText className="h-4 w-4" />
              View All Requests
            </Button>
          </Link>
        )}
      </div>

      {!loadingProfile && <VettingBanner profile={profile_} />}

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

      {isApproved && (
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
      )}

      {!isApproved && !loadingProfile && profile_?.status !== "pending_review" && (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Pending Approval</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Once your vendor profile is approved, your dashboard will show live quote requests and bookings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
