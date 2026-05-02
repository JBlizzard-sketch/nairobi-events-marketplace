import { useAdminGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Building2, Calendar, Briefcase, TrendingUp, Clock } from "lucide-react";

export default function AdminStats() {
  const { data: stats, isLoading } = useAdminGetStats();

  const s = stats as any;

  const statCards = [
    { label: "Total Users", value: s?.totalUsers ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Vendors", value: s?.totalVendors ?? 0, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending Approvals", value: s?.pendingVendors ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Total Events", value: s?.totalEvents ?? 0, icon: Calendar, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Total Bookings", value: s?.totalBookings ?? 0, icon: Briefcase, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Platform Revenue (KES)", value: s?.totalRevenue ? Number(s.totalRevenue).toLocaleString() : "0", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time marketplace statistics</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`${bg} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold tracking-tight mt-0.5">{value}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Active Events</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-20" /> : (
              <div className="text-center py-4">
                <p className="text-5xl font-bold text-primary">{s?.activeEvents ?? 0}</p>
                <p className="text-muted-foreground text-sm mt-2">Events currently requesting quotes</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Approval Queue</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-20" /> : (
              <div className="text-center py-4">
                <p className="text-5xl font-bold text-amber-600">{s?.pendingVendors ?? 0}</p>
                <p className="text-muted-foreground text-sm mt-2">Vendors waiting for review</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
