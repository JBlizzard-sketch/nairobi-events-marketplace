import { Link } from "wouter";
import { useListMyQuoteRequests, useListMyBookings, useGetMyVendorProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  FileText, ChevronRight, Star, Briefcase, Clock,
  Clock3, AlertTriangle, XCircle, PauseCircle, CheckCircle2,
  TrendingUp, Circle, UserCog, CalendarDays,
} from "lucide-react";

function OnboardingChecklist({ profile }: { profile: any }) {
  if (!profile || profile.status === "approved") return null;

  const steps = [
    {
      label: "Create your vendor profile",
      done: !!profile,
      href: "/vendor/profile",
    },
    {
      label: "Write a business description",
      done: !!(profile?.description && profile.description.trim().length > 20),
      href: "/vendor/profile",
    },
    {
      label: "Add service areas",
      done: !!(profile?.serviceAreas && profile.serviceAreas.length > 0),
      href: "/vendor/profile",
    },
    {
      label: "Submit profile for review",
      done: ["pending_review", "approved", "rejected", "suspended"].includes(profile?.status),
      href: "/vendor/profile",
    },
    {
      label: "Get approved and start earning",
      done: profile?.status === "approved",
      href: "/vendor/profile",
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const pct = Math.round((completedCount / steps.length) * 100);
  const nextStep = steps.find(s => !s.done);

  return (
    <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-2 rounded-lg">
              <UserCog className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Getting Started</CardTitle>
              <CardDescription className="text-xs mt-0.5">{completedCount} of {steps.length} steps complete</CardDescription>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-2xl font-bold text-primary">{pct}%</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
          <div
            className="bg-primary rounded-full h-1.5 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-4">
        {steps.map((step, i) => (
          <Link key={i} href={step.href}>
            <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer ${
              step.done
                ? "opacity-60"
                : nextStep === step
                ? "bg-primary/10 border border-primary/20 hover:bg-primary/15"
                : "hover:bg-muted/50"
            }`}>
              <div className="flex-shrink-0">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : nextStep === step ? (
                  <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/20" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40" />
                )}
              </div>
              <span className={`text-sm flex-1 ${step.done ? "line-through text-muted-foreground" : nextStep === step ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
              {!step.done && nextStep === step && (
                <ChevronRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              )}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function VettingBanner({ profile }: { profile: any }) {
  if (!profile) return null;

  if (profile.status === "pending_review") {
    return (
      <Alert className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
        <Clock3 className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold">Profile Under Review</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-400">
          Your vendor application is being reviewed by our team. This typically takes 1–2 business days.
          You'll receive a notification as soon as a decision is made.
        </AlertDescription>
      </Alert>
    );
  }

  if (profile.status === "rejected") {
    return (
      <Alert className="border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-300 font-semibold">Application Not Approved</AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-400 space-y-3">
          <p>
            {profile.adminNotes
              ? <>Reason: <span className="font-medium">{profile.adminNotes}</span></>
              : "Your application was not approved at this time."}
          </p>
          <p>You can update your profile and resubmit for review.</p>
          <Link href="/vendor/profile">
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/40 mt-1">
              Update Profile &amp; Resubmit
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (profile.status === "suspended") {
    return (
      <Alert className="border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/30">
        <PauseCircle className="h-4 w-4 text-slate-600" />
        <AlertTitle className="text-slate-800 dark:text-slate-300 font-semibold">Account Suspended</AlertTitle>
        <AlertDescription className="text-slate-700 dark:text-slate-400">
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
  const { data: profile, isLoading: loadingProfile, isError: profileError } = useGetMyVendorProfile();
  const { data: requests, isLoading: loadingRequests } = useListMyQuoteRequests({ status: "requested" as any });
  const { data: bookings, isLoading: loadingBookings } = useListMyBookings({});

  const profile_ = profile as any;
  const allRequests = (Array.isArray(requests) ? requests : []) as any[];
  const pendingRequests = allRequests.filter((r: any) => r.status === "requested");
  const submittedRequests = allRequests.filter((r: any) => r.status === "submitted");
  const allBookings2 = (Array.isArray(bookings) ? bookings : []) as any[];
  const activeBookings = allBookings2.filter((b: any) => ["in_escrow", "confirmed"].includes(b.status));
  const wonBookings = allBookings2.filter((b: any) => b.status !== "cancelled" && b.status !== "refunded");

  // Win rate: bookings won / quotes submitted
  const totalSubmitted = submittedRequests.length;
  const winRate = totalSubmitted > 0 ? Math.round((wonBookings.length / totalSubmitted) * 100) : null;

  const isApproved = profile_?.status === "approved";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {loadingProfile ? <Skeleton className="h-8 w-48 inline-block" /> : profile_?.businessName ?? "Vendor Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {loadingProfile ? "" : (
              <span className="flex items-center gap-2 flex-wrap">
                {profile_?.status === "approved" ? (
                  <Badge variant="secondary" className="text-xs gap-1 bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50">
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

      {!loadingProfile && <OnboardingChecklist profile={profile_} />}
      {!loadingProfile && <VettingBanner profile={profile_} />}

      {profileError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to load dashboard data — please refresh the page.</span>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Pending Requests</CardDescription>
            <CardTitle className="text-3xl sm:text-4xl text-primary">
              {loadingRequests ? <Skeleton className="h-10 w-16" /> : pendingRequests.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Awaiting your quote</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Win Rate</CardDescription>
            <CardTitle className="text-3xl sm:text-4xl text-foreground">
              {loadingRequests || loadingBookings ? (
                <Skeleton className="h-10 w-16" />
              ) : winRate !== null ? (
                <span className={winRate >= 50 ? "text-emerald-600" : "text-amber-600"}>
                  {winRate}%
                </span>
              ) : (
                <span className="text-muted-foreground text-2xl">—</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {winRate !== null
                ? `${wonBookings.length} won of ${totalSubmitted} quoted`
                : "Submit quotes to track"}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Active Bookings</CardDescription>
            <CardTitle className="text-3xl sm:text-4xl text-foreground">
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
            <CardTitle className="text-3xl sm:text-4xl text-foreground">
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
              <Link href="/vendor/bookings">
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
                <div className="space-y-2">
                  {activeBookings.slice(0, 4).map((b: any) => (
                    <Link key={b.id} href={`/vendor/bookings/${b.id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all group">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                            {b.eventTitle ?? `#${b.id.slice(0, 8).toUpperCase()}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {b.eventDate
                              ? new Date(b.eventDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) + " · "
                              : ""}
                            KES {Number(b.vendorPayoutAmount ?? b.totalAmount).toLocaleString()} payout
                          </p>
                        </div>
                        <Badge className={`capitalize text-xs flex-shrink-0 ${
                          b.status === "in_escrow"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50"
                        }`}>
                          {b.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue chart — last 6 months */}
      {isApproved && !loadingBookings && (() => {
        const allBookings = (Array.isArray(bookings) ? bookings : []) as any[];
        const completedBookings = allBookings.filter(b => b.status === "completed" || b.status === "in_escrow");
        if (completedBookings.length === 0) return null;

        // Build 6-month buckets
        const now = new Date();
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return {
            label: d.toLocaleDateString("en-KE", { month: "short" }),
            year: d.getFullYear(),
            month: d.getMonth(),
            amount: 0,
          };
        });
        completedBookings.forEach(b => {
          const d = new Date(b.createdAt);
          const bucket = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
          if (bucket) bucket.amount += Number(b.vendorPayoutAmount ?? 0);
        });

        const totalEarned = months.reduce((s, m) => s + m.amount, 0);
        if (totalEarned === 0) return null;

        return (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Earnings (Last 6 Months)
                </CardTitle>
                <CardDescription>
                  Total: KES {totalEarned.toLocaleString()}
                </CardDescription>
              </div>
              <Link href="/vendor/bookings">
                <Button variant="outline" size="sm">View Bookings</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={months} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Payout"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })()}

      {/* Upcoming events calendar strip */}
      {isApproved && !loadingBookings && (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = allBookings2
          .filter((b: any) => b.eventDate && new Date(b.eventDate) >= today && ["confirmed", "in_escrow"].includes(b.status))
          .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
          .slice(0, 5);
        if (upcoming.length === 0) return null;

        const daysUntil = (dateStr: string) => {
          const target = new Date(dateStr);
          target.setHours(0, 0, 0, 0);
          return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        };

        return (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>Your next confirmed bookings</CardDescription>
              </div>
              <Link href="/vendor/bookings">
                <Button variant="outline" size="sm">All Bookings</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.map((b: any) => {
                const days = daysUntil(b.eventDate);
                const isUrgent = days <= 3;
                const isSoon = days <= 7;
                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      isUrgent ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20" :
                      isSoon ? "border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20" :
                      "border-border bg-muted/10 hover:bg-muted/30"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black text-xs ${
                      isUrgent ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" :
                      isSoon ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" :
                      "bg-primary/10 text-primary"
                    }`}>
                      <span className="text-xl leading-none">{days === 0 ? "!" : days}</span>
                      <span className="font-semibold">{days === 0 ? "Today" : "days"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{b.eventTitle ?? `Booking #${b.id.slice(0, 6).toUpperCase()}`}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(b.eventDate).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        {b.eventCity ? ` · ${b.eventCity}` : ""}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold">KES {Number(b.vendorPayoutAmount).toLocaleString()}</p>
                      <Badge variant="outline" className={`text-[10px] mt-0.5 ${isUrgent ? "border-red-300 text-red-700 dark:border-red-700 dark:text-red-400" : isSoon ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400" : ""}`}>
                        {b.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })()}

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
