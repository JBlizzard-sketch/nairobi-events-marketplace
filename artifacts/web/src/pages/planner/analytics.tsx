import { useMemo } from "react";
import { useListMyBookings, useListMyEvents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  TrendingUp, Briefcase, Calendar, Star, Building2, Wallet, Download, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function exportPlannerCsv(bookings: any[]) {
  const headers = [
    "Booking Ref", "Status", "Event", "Event Date",
    "Vendor", "Category", "Amount (KES)", "Platform Fee (KES)", "Created",
  ];
  const rows = bookings.map(b => [
    `#${(b.id ?? "").slice(0, 8).toUpperCase()}`,
    b.status ?? "",
    `"${(b.eventTitle ?? "").replace(/"/g, '""')}"`,
    b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-KE") : "",
    `"${(b.vendorBusinessName ?? "").replace(/"/g, '""')}"`,
    b.category ?? "",
    Number(b.totalAmount ?? 0).toFixed(2),
    Number(b.platformFeeAmount ?? 0).toFixed(2),
    b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-KE") : "",
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spend-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "#10b981", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316",
];

function formatKES(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n.toLocaleString()}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {formatKES(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function PlannerAnalytics() {
  const { data: bookingsRaw, isLoading: loadingBookings, isError: bookingsError } = useListMyBookings({});
  const { data: eventsRaw, isLoading: loadingEvents } = useListMyEvents({} as any);

  const bookings = useMemo(() =>
    (Array.isArray(bookingsRaw) ? bookingsRaw : []) as any[],
  [bookingsRaw]);

  const events = useMemo(() =>
    (Array.isArray(eventsRaw) ? eventsRaw : (eventsRaw as any)?.events ?? []) as any[],
  [eventsRaw]);

  const activeBookings = bookings.filter(b => b.status !== "cancelled" && b.status !== "refunded");

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalSpend = activeBookings.reduce((s, b) => s + Number(b.totalAmount), 0);
  const completedBookings = activeBookings.filter(b => b.status === "completed");
  const activeEvents = events.filter((e: any) => !["completed", "cancelled"].includes(e.status));
  const vendorsUsed = new Set(activeBookings.map(b => b.vendorId)).size;

  // ── Spend by category ──────────────────────────────────────────────────────
  const spendByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    activeBookings.forEach(b => {
      const cat = (b.category ?? "other").replace(/_/g, " ");
      map[cat] = (map[cat] ?? 0) + Number(b.totalAmount);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value);
  }, [activeBookings]);

  // ── Monthly spend (last 6 months) ─────────────────────────────────────────
  const monthlySpend = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        label: d.toLocaleDateString("en-KE", { month: "short" }),
        year: d.getFullYear(),
        month: d.getMonth(),
        spend: 0,
        bookings: 0,
      };
    });
    activeBookings.forEach(b => {
      const d = new Date(b.createdAt);
      const bucket = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
      if (bucket) {
        bucket.spend += Number(b.totalAmount);
        bucket.bookings++;
      }
    });
    return months;
  }, [activeBookings]);

  // ── Top vendors ────────────────────────────────────────────────────────────
  const topVendors = useMemo(() => {
    const map: Record<string, { name: string; spend: number; bookings: number; category: string }> = {};
    activeBookings.forEach(b => {
      if (!b.vendorId) return;
      const key = b.vendorId;
      if (!map[key]) {
        map[key] = {
          name: b.vendorBusinessName ?? "Vendor",
          spend: 0,
          bookings: 0,
          category: b.category ?? "",
        };
      }
      map[key].spend += Number(b.totalAmount);
      map[key].bookings++;
    });
    return Object.values(map).sort((a, b) => b.spend - a.spend).slice(0, 5);
  }, [activeBookings]);

  const isLoading = loadingBookings || loadingEvents;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Spend Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your event spending and vendor usage</p>
        </div>
        {!isLoading && activeBookings.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
            onClick={() => exportPlannerCsv(activeBookings)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {bookingsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to load analytics data — please refresh the page.</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Spend",
            value: isLoading ? null : formatKES(totalSpend),
            icon: Wallet,
            color: "text-primary",
            bg: "bg-primary/10",
            border: "border-primary/20",
          },
          {
            label: "Active Events",
            value: isLoading ? null : activeEvents.length,
            icon: Calendar,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/40",
            border: "border-blue-100 dark:border-blue-900/50",
          },
          {
            label: "Bookings Made",
            value: isLoading ? null : activeBookings.length,
            icon: Briefcase,
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-950/40",
            border: "border-violet-100 dark:border-violet-900/50",
          },
          {
            label: "Vendors Used",
            value: isLoading ? null : vendorsUsed,
            icon: Building2,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
            border: "border-emerald-100 dark:border-emerald-900/50",
          },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <Card key={label} className={`shadow-sm border ${border}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${bg} p-2.5 rounded-xl flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                  {value === null ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-black mt-0.5">{value}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly spend trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Monthly Spend
            </CardTitle>
            <CardDescription>Last 6 months of bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : activeBookings.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No booking data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlySpend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                  <Tooltip content={<CUSTOM_TOOLTIP />} />
                  <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={52} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Spend by category */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
            <CardDescription>Breakdown across vendor types</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full rounded-lg" />
            ) : spendByCategory.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No booking data yet
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="50%" height={190}>
                  <PieChart>
                    <Pie
                      data={spendByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {spendByCategory.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => formatKES(v)}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid hsl(var(--border))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {spendByCategory.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-1">
                          <span className="text-xs font-medium truncate capitalize">{cat.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {totalSpend > 0 ? Math.round((cat.value / totalSpend) * 100) : 0}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatKES(cat.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top vendors */}
      {topVendors.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Top Vendors Used
            </CardTitle>
            <CardDescription>Your most engaged service providers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topVendors.map((v, i) => {
                const pct = totalSpend > 0 ? Math.round((v.spend / totalSpend) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">{v.name}</span>
                          {v.category && (
                            <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                              {v.category.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {v.bookings} booking{v.bookings !== 1 ? "s" : ""}
                          </span>
                          <span className="text-sm font-bold">{formatKES(v.spend)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent bookings table */}
      {activeBookings.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Your latest confirmed vendor engagements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeBookings.slice(0, 8).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0 gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{b.eventTitle ?? "Event"}</span>
                      {b.category && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {b.category.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                      {b.vendorBusinessName && <span>{b.vendorBusinessName}</span>}
                      {b.eventDate && <span>· {formatDate(b.eventDate)}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">KES {Number(b.totalAmount).toLocaleString()}</p>
                    <p className="text-xs capitalize text-muted-foreground">{b.status.replace(/_/g, " ")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending insights */}
      {!isLoading && activeBookings.length > 0 && (() => {
        const avgValue = activeBookings.length > 0
          ? Math.round(totalSpend / activeBookings.length)
          : 0;

        const thisMonthSpend = monthlySpend[monthlySpend.length - 1]?.spend ?? 0;
        const lastMonthSpend = monthlySpend[monthlySpend.length - 2]?.spend ?? 0;
        const trendPct = lastMonthSpend > 0
          ? Math.round(((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100)
          : null;

        const bestMonth = monthlySpend.reduce(
          (best, m) => (m.spend > (best?.spend ?? 0) ? m : best),
          null as null | { label: string; spend: number }
        );

        const topCat = spendByCategory[0];

        const insights: Array<{ icon: any; color: string; bg: string; text: string }> = [];

        if (avgValue > 0) {
          insights.push({
            icon: Wallet,
            color: "text-primary",
            bg: "bg-primary/10",
            text: `Average booking value: ${formatKES(avgValue)} across ${activeBookings.length} booking${activeBookings.length !== 1 ? "s" : ""}`,
          });
        }
        if (trendPct !== null) {
          const up = trendPct >= 0;
          insights.push({
            icon: TrendingUp,
            color: up ? "text-emerald-600" : "text-red-500",
            bg: up ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-red-50 dark:bg-red-950/40",
            text: up
              ? `Spend up ${trendPct}% this month vs last month`
              : `Spend down ${Math.abs(trendPct)}% this month vs last month`,
          });
        }
        if (bestMonth && bestMonth.spend > 0) {
          insights.push({
            icon: Calendar,
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-950/40",
            text: `Highest spend month: ${bestMonth.label} (${formatKES(bestMonth.spend)})`,
          });
        }
        if (topCat) {
          insights.push({
            icon: Building2,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/40",
            text: `Top category: ${topCat.name} — ${formatKES(topCat.value)} (${totalSpend > 0 ? Math.round((topCat.value / totalSpend) * 100) : 0}% of spend)`,
          });
        }

        if (insights.length === 0) return null;

        return (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Spending Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {insights.map((ins, i) => {
                const Icon = ins.icon;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className={`${ins.bg} p-2 rounded-lg flex-shrink-0`}>
                      <Icon className={`h-4 w-4 ${ins.color}`} />
                    </div>
                    <p className="text-sm font-medium">{ins.text}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })()}

      {/* Empty state */}
      {!isLoading && activeBookings.length === 0 && events.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No data yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Your spend analytics will appear here once you've created events and confirmed bookings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
