import { useMemo } from "react";
import { useListMyBookings, useListMyQuoteRequests, useGetMyVendorProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Briefcase, Star, FileText, DollarSign, Trophy, Target, Download, AlertTriangle,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";

function exportVendorCsv(bookings: any[]) {
  const headers = ["Booking Ref", "Status", "Event", "Event Date", "Amount (KES)", "Payout (KES)", "Booked Date"];
  const rows = bookings.map(b => [
    `#${b.id.slice(0, 8).toUpperCase()}`,
    b.status,
    `"${(b.eventTitle ?? "").replace(/"/g, '""')}"`,
    b.eventDate ? new Date(b.eventDate).toLocaleDateString("en-KE") : "",
    Number(b.totalAmount ?? 0).toFixed(2),
    Number(b.vendorPayoutAmount ?? 0).toFixed(2),
    b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-KE") : "",
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vendor-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function formatKES(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n.toLocaleString()}`;
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "Revenue" ? formatKES(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${accent ?? "bg-primary/10"}`}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VendorAnalytics() {
  const { data: bookingsRaw, isLoading: loadingBookings, isError: bookingsError } = useListMyBookings({} as any);
  const { data: requestsRaw, isLoading: loadingRequests } = useListMyQuoteRequests({} as any);
  const { data: profileRaw } = useGetMyVendorProfile();

  const profile = profileRaw as any;

  const bookings = useMemo(() =>
    (Array.isArray(bookingsRaw) ? bookingsRaw : []) as any[],
  [bookingsRaw]);

  const requests = useMemo(() =>
    (Array.isArray(requestsRaw) ? requestsRaw : []) as any[],
  [requestsRaw]);

  const isLoading = loadingBookings || loadingRequests;
  useDocumentTitle("Analytics");

  // ── KPIs ──────────────────────────────────────────────────────────────────────
  const activeBookings = useMemo(() =>
    bookings.filter(b => !["cancelled", "refunded"].includes(b.status)),
  [bookings]);

  const earningBookings = useMemo(() =>
    bookings.filter(b => ["completed", "in_escrow", "confirmed"].includes(b.status)),
  [bookings]);

  const totalRevenue = useMemo(() =>
    earningBookings.reduce((s, b) => s + Number(b.totalAmount), 0),
  [earningBookings]);

  const completedCount = bookings.filter(b => b.status === "completed").length;
  const pendingCount = bookings.filter(b => ["pending", "confirmed", "in_escrow"].includes(b.status)).length;

  const respondedRequests = requests.filter(r => r.status === "submitted");
  const responseRate = requests.length > 0
    ? Math.round((respondedRequests.length / requests.length) * 100)
    : 0;

  const winRate = respondedRequests.length > 0
    ? Math.round((completedCount / respondedRequests.length) * 100)
    : 0;

  // ── Monthly revenue (last 6 months) ──────────────────────────────────────────
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      months.push({
        label: d.toLocaleDateString("en-KE", { month: "short" }),
        start,
        end,
      });
    }
    return months.map(({ label, start, end }) => {
      const revenue = earningBookings
        .filter(b => {
          const d = new Date(b.createdAt ?? b.updatedAt ?? 0);
          return d >= start && d <= end;
        })
        .reduce((s, b) => s + Number(b.totalAmount), 0);
      return { label, Revenue: revenue };
    });
  }, [earningBookings]);

  // ── Quote funnel ────────────────────────────────────────────────────────────
  const funnelData = [
    { label: "Received", count: requests.length },
    { label: "Responded", count: respondedRequests.length },
    { label: "Won", count: completedCount },
  ];

  // ── Booking status breakdown ─────────────────────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.status] = (counts[b.status] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      label: status.replace(/_/g, " "),
      count,
    }));
  }, [bookings]);

  // ── Best month ───────────────────────────────────────────────────────────────
  const bestMonth = monthlyRevenue.reduce(
    (best, m) => (m.Revenue > (best?.Revenue ?? 0) ? m : best),
    null as null | { label: string; Revenue: number }
  );

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      {bookingsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to load analytics data — please refresh the page.</span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Performance overview for {profile?.businessName ?? "your business"}
          </p>
        </div>
        {bookings.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
            onClick={() => exportVendorCsv(bookings)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatKES(totalRevenue)}
          sub={`${completedCount} completed`}
          accent="bg-primary/10"
        />
        <KpiCard
          icon={Target}
          label="Response Rate"
          value={`${responseRate}%`}
          sub={`${respondedRequests.length} of ${requests.length} requests`}
          accent="bg-violet-50 dark:bg-violet-950/40"
        />
        <KpiCard
          icon={Trophy}
          label="Win Rate"
          value={`${winRate}%`}
          sub="quotes accepted"
          accent="bg-amber-50 dark:bg-amber-950/40"
        />
        <KpiCard
          icon={Star}
          label="Avg Rating"
          value={profile?.averageRating && Number(profile.averageRating) > 0
            ? Number(profile.averageRating).toFixed(1)
            : "—"}
          sub={`${profile?.totalReviews ?? 0} reviews`}
          accent="bg-emerald-50 dark:bg-emerald-950/40"
        />
      </div>

      {/* Revenue chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Last 6 months · confirmed + in-escrow + completed bookings</CardDescription>
            </div>
            {bestMonth && bestMonth.Revenue > 0 && (
              <Badge variant="outline" className="gap-1 text-xs text-primary border-primary/30">
                <TrendingUp className="h-3 w-3" />
                Best: {bestMonth.label} ({formatKES(bestMonth.Revenue)})
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {totalRevenue === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                  tickFormatter={(v: number) => formatKES(v)}
                />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Quote funnel + Booking status */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quote funnel */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Quote Funnel
            </CardTitle>
            <CardDescription>How requests convert to wins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No quote requests yet</p>
            ) : (
              funnelData.map((row, i) => {
                const pct = funnelData[0].count > 0
                  ? Math.round((row.count / funnelData[0].count) * 100)
                  : 0;
                const barColor = i === 0 ? "bg-primary" : i === 1 ? "bg-violet-500" : "bg-emerald-500";
                return (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{row.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{row.count}</span>
                        {i > 0 && (
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.max(pct, row.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Booking status */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Booking Status
            </CardTitle>
            <CardDescription>All-time booking breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No bookings yet</p>
            ) : (
              statusBreakdown.map(({ label, count }) => {
                const pct = Math.round((count / bookings.length) * 100);
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground capitalize w-24 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full"
                        style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-6 text-right flex-shrink-0">{count}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance insights */}
      {bookings.length > 0 && (() => {
        const avgBookingValue = earningBookings.length > 0
          ? Math.round(earningBookings.reduce((s, b) => s + Number(b.totalAmount), 0) / earningBookings.length)
          : 0;

        const thisMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.Revenue ?? 0;
        const lastMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.Revenue ?? 0;
        const trendPct = lastMonthRevenue > 0
          ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
          : null;

        const acceptanceRate = requests.length > 0
          ? Math.round((completedCount / requests.length) * 100)
          : null;

        const insights: Array<{ icon: any; color: string; bg: string; text: string }> = [];

        if (avgBookingValue > 0) {
          insights.push({
            icon: DollarSign,
            color: "text-primary",
            bg: "bg-primary/10",
            text: `Average booking value: ${formatKES(avgBookingValue)}`,
          });
        }
        if (trendPct !== null) {
          const up = trendPct >= 0;
          insights.push({
            icon: TrendingUp,
            color: up ? "text-emerald-600" : "text-red-500",
            bg: up ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-red-50 dark:bg-red-950/40",
            text: up
              ? `Revenue up ${trendPct}% vs last month`
              : `Revenue down ${Math.abs(trendPct)}% vs last month`,
          });
        }
        if (acceptanceRate !== null) {
          insights.push({
            icon: Target,
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-950/40",
            text: `${acceptanceRate}% of received requests converted to completed bookings`,
          });
        }
        if (bestMonth && bestMonth.Revenue > 0) {
          insights.push({
            icon: Trophy,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/40",
            text: `Best month: ${bestMonth.label} (${formatKES(bestMonth.Revenue)})`,
          });
        }

        if (insights.length === 0) return null;

        return (
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Performance Insights
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

      {/* Quick stats */}
      {pendingCount > 0 && (
        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex items-center gap-4">
            <Briefcase className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm">
              <span className="font-semibold text-primary">{pendingCount} active booking{pendingCount !== 1 ? "s" : ""}</span>
              {" "}currently in progress — funds held securely in escrow until your events are complete.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
