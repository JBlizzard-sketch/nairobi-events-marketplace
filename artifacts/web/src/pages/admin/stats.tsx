import { useAdminGetStats, useAdminListBookings, useAdminListVendors } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Users, Building2, Calendar, Briefcase, TrendingUp, Clock,
  CheckCircle2, XCircle, ChevronRight, AlertTriangle, ShieldCheck,
  UserCheck, UserX,
} from "lucide-react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

type ActivityItem = {
  id: string;
  type: "booking_disputed" | "booking_completed" | "booking_in_escrow" | "booking_created" | "vendor_pending" | "vendor_approved" | "vendor_rejected";
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
};

export default function AdminStats() {
  const { data: stats, isLoading } = useAdminGetStats();
  const s = stats as any;

  const { data: bookingsRaw } = useAdminListBookings({ page: 1, limit: 500 });
  const allBookings = useMemo(() => {
    const raw = bookingsRaw as any;
    return (Array.isArray(raw) ? raw : raw?.bookings ?? []) as any[];
  }, [bookingsRaw]);

  const { data: vendorsRaw } = useAdminListVendors({ limit: 200 });
  const allVendors = useMemo(() => {
    const raw = vendorsRaw as any;
    return (Array.isArray(raw) ? raw : raw?.vendors ?? []) as any[];
  }, [vendorsRaw]);

  const recentActivity = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];

    allBookings.forEach((b: any) => {
      if (!b.createdAt) return;
      const vendor = b.vendorBusinessName ?? "a vendor";
      const planner = b.plannerName ?? "a planner";
      const ref = `#${(b.id ?? "").slice(0, 8).toUpperCase()}`;
      if (b.status === "disputed") {
        items.push({ id: `b-disp-${b.id}`, type: "booking_disputed", title: `Dispute raised on booking ${ref}`, subtitle: `${planner} · KES ${Number(b.totalAmount ?? 0).toLocaleString()}`, href: "/admin/bookings", createdAt: b.updatedAt ?? b.createdAt });
      } else if (b.status === "completed") {
        items.push({ id: `b-comp-${b.id}`, type: "booking_completed", title: `Booking ${ref} completed`, subtitle: `${vendor} → ${planner}`, href: "/admin/bookings", createdAt: b.updatedAt ?? b.createdAt });
      } else if (b.status === "in_escrow") {
        items.push({ id: `b-esc-${b.id}`, type: "booking_in_escrow", title: `Payment in escrow for ${ref}`, subtitle: `${planner} paid KES ${Number(b.totalAmount ?? 0).toLocaleString()}`, href: "/admin/bookings", createdAt: b.updatedAt ?? b.createdAt });
      } else {
        items.push({ id: `b-new-${b.id}`, type: "booking_created", title: `New booking ${ref}`, subtitle: `${planner} booked ${vendor}`, href: "/admin/bookings", createdAt: b.createdAt });
      }
    });

    allVendors.forEach((v: any) => {
      if (!v.createdAt) return;
      const name = v.businessName ?? v.name ?? "Unknown vendor";
      if (v.approvalStatus === "pending") {
        items.push({ id: `v-pend-${v.id}`, type: "vendor_pending", title: `New vendor application`, subtitle: name, href: "/admin/vendors", createdAt: v.createdAt });
      } else if (v.approvalStatus === "approved") {
        items.push({ id: `v-appr-${v.id}`, type: "vendor_approved", title: `Vendor approved`, subtitle: name, href: "/admin/vendors", createdAt: v.updatedAt ?? v.createdAt });
      } else if (v.approvalStatus === "rejected") {
        items.push({ id: `v-rej-${v.id}`, type: "vendor_rejected", title: `Vendor application rejected`, subtitle: name, href: "/admin/vendors", createdAt: v.updatedAt ?? v.createdAt });
      }
    });

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  }, [allBookings, allVendors]);

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        label: d.toLocaleDateString("en-KE", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth(),
        revenue: 0,
        bookings: 0,
      };
    });
    allBookings
      .filter(b => ["completed", "in_escrow"].includes(b.status))
      .forEach(b => {
        const d = new Date(b.createdAt);
        const bucket = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
        if (bucket) {
          bucket.revenue += Number(b.platformFeeAmount ?? 0);
          bucket.bookings++;
        }
      });
    return months;
  }, [allBookings]);

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

      {/* Platform revenue trend */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Platform Revenue
            </CardTitle>
            <CardDescription>Monthly escrow fees collected (last 6 months)</CardDescription>
          </div>
          <Link href="/admin/bookings">
            <Button variant="outline" size="sm" className="gap-1">
              All Bookings <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Platform Fee"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

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

      {/* ── Recent Activity Feed ─────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest platform events across all users</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || recentActivity.length === 0 ? (
            isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No activity yet — bookings and vendor events will appear here.
              </div>
            )
          ) : (
            <div className="space-y-1">
              {recentActivity.map((item) => {
                const cfg = {
                  booking_disputed:  { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
                  booking_completed: { icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50" },
                  booking_in_escrow: { icon: ShieldCheck,   color: "text-primary",     bg: "bg-primary/10" },
                  booking_created:   { icon: Briefcase,     color: "text-blue-600",    bg: "bg-blue-50" },
                  vendor_pending:    { icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50" },
                  vendor_approved:   { icon: UserCheck,     color: "text-emerald-600", bg: "bg-emerald-50" },
                  vendor_rejected:   { icon: UserX,         color: "text-red-500",     bg: "bg-red-50" },
                }[item.type] ?? { icon: Briefcase, color: "text-muted-foreground", bg: "bg-muted" };
                const Icon = cfg.icon;
                return (
                  <Link key={item.id} href={item.href}>
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer group">
                      <div className={`${cfg.bg} p-2 rounded-lg flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(item.createdAt)}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking status breakdown */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Booking Status Breakdown
          </CardTitle>
          <CardDescription>Distribution of all bookings by current status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : (() => {
            const statusDefs: Array<{ key: string; label: string; icon: any; color: string; bg: string; bar: string }> = [
              { key: "completed",  label: "Completed",      icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50",   bar: "bg-emerald-500" },
              { key: "in_escrow",  label: "In Escrow",      icon: ShieldCheck,   color: "text-primary",     bg: "bg-primary/10",   bar: "bg-primary" },
              { key: "confirmed",  label: "Confirmed",      icon: UserCheck,     color: "text-blue-600",    bg: "bg-blue-50",      bar: "bg-blue-500" },
              { key: "pending",    label: "Pending Payment",icon: Clock,         color: "text-amber-600",   bg: "bg-amber-50",     bar: "bg-amber-400" },
              { key: "disputed",   label: "Disputed",       icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10",bar: "bg-destructive" },
              { key: "cancelled",  label: "Cancelled",      icon: XCircle,       color: "text-muted-foreground", bg: "bg-muted",   bar: "bg-muted-foreground/40" },
              { key: "refunded",   label: "Refunded",       icon: XCircle,       color: "text-orange-600",  bg: "bg-orange-50",    bar: "bg-orange-400" },
            ];
            const counts = statusDefs.map(d => ({
              ...d,
              count: allBookings.filter((b: any) => b.status === d.key).length,
            })).filter(d => d.count > 0 || ["completed", "in_escrow", "pending", "disputed"].includes(d.key));
            const maxCount = Math.max(...counts.map(d => d.count), 1);
            return (
              <div className="space-y-2.5">
                {counts.map(({ key, label, icon: Icon, color, bg, bar, count }) => (
                  <div key={key} className="flex items-center gap-4 p-3 rounded-xl bg-muted/20">
                    <div className={`${bg} p-2 rounded-lg flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-sm font-bold tabular-nums">{count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`${bar} h-full rounded-full transition-all duration-700`}
                          style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
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
