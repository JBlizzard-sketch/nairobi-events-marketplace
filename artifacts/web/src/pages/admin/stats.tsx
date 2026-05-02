import { useAdminGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Users, Building2, Calendar, Briefcase, TrendingUp, Clock,
  CheckCircle2, XCircle, ChevronRight,
} from "lucide-react";

export default function AdminStats() {
  const { data: stats, isLoading } = useAdminGetStats();
  const s = stats as any;

  const statCards = [
    { label: "Total Users", value: s?.totalUsers ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "Total Vendors", value: s?.totalVendors ?? 0, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
    { label: "Total Events", value: s?.totalEvents ?? 0, icon: Calendar, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
    { label: "Total Bookings", value: s?.totalBookings ?? 0, icon: Briefcase, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    {
      label: "Platform Revenue",
      value: s?.totalRevenue ? `KES ${Number(s.totalRevenue).toLocaleString()}` : "KES 0",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
    },
    { label: "Active Events", value: s?.activeEvents ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time marketplace statistics</p>
      </div>

      {/* Main stats grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <Card key={label} className={`shadow-sm border ${border}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`${bg} p-3 rounded-xl flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                  {isLoading ? (
                    <Skeleton className="h-9 w-24 mt-1.5" />
                  ) : (
                    <p className="text-3xl font-black tracking-tight mt-0.5">{value}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vendor approval funnel */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vendor Approval Funnel</CardTitle>
          <Link href="/admin/vendors">
            <Button variant="outline" size="sm" className="gap-1">
              Manage Vendors <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: "Pending Review",
                  count: s?.pendingVendors ?? 0,
                  icon: Clock,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                  bar: "bg-amber-400",
                  action: s?.pendingVendors > 0 ? "Review now" : null,
                  href: "/admin/vendors",
                },
                {
                  label: "Approved Vendors",
                  count: s?.approvedVendors ?? 0,
                  icon: CheckCircle2,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                  bar: "bg-emerald-500",
                  action: null,
                  href: null,
                },
                {
                  label: "Rejected Applications",
                  count: s?.rejectedVendors ?? 0,
                  icon: XCircle,
                  color: "text-red-500",
                  bg: "bg-red-50",
                  bar: "bg-red-400",
                  action: null,
                  href: null,
                },
              ].map(({ label, count, icon: Icon, color, bg, bar, action, href }) => {
                const total = (s?.pendingVendors ?? 0) + (s?.approvedVendors ?? 0) + (s?.rejectedVendors ?? 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-4 p-3 rounded-xl bg-muted/20">
                    <div className={`${bg} p-2 rounded-lg flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{label}</span>
                        <div className="flex items-center gap-3">
                          {action && href && (
                            <Link href={href}>
                              <span className={`text-xs font-semibold ${color} underline cursor-pointer`}>{action}</span>
                            </Link>
                          )}
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`${bar} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick admin actions */}
      <div className="grid sm:grid-cols-2 gap-5">
        <Card className="shadow-sm border-amber-200 bg-amber-50/50">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-xl">
              <Clock className="h-6 w-6 text-amber-700" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Pending Approvals</p>
              <p className="text-sm text-amber-700 mt-0.5">
                {isLoading ? "..." : `${s?.pendingVendors ?? 0} vendor${s?.pendingVendors !== 1 ? "s" : ""} waiting for review`}
              </p>
              <Link href="/admin/vendors">
                <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
                  Review Applications <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="bg-primary/15 p-3 rounded-xl">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Active Events</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isLoading ? "..." : `${s?.activeEvents ?? 0} event${s?.activeEvents !== 1 ? "s" : ""} currently requesting quotes`}
              </p>
              <p className="text-xs text-muted-foreground mt-3 font-medium">
                {isLoading ? "" : `${s?.totalBookings ?? 0} total bookings all time`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
