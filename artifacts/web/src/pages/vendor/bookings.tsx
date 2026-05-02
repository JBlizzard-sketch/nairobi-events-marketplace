import { Link } from "wouter";
import { useListMyBookings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Briefcase, ChevronRight, ShieldCheck, CheckCircle2,
  XCircle, AlertTriangle, Clock, Calendar, User,
} from "lucide-react";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: "Pending Payment", icon: Clock, className: "bg-muted text-muted-foreground" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, className: "bg-blue-100 text-blue-800 border-blue-200" },
  in_escrow: { label: "In Escrow", icon: ShieldCheck, className: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  disputed: { label: "Disputed", icon: AlertTriangle, className: "bg-red-100 text-red-800 border-red-200" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-muted text-muted-foreground" },
  refunded: { label: "Refunded", icon: XCircle, className: "bg-orange-100 text-orange-800 border-orange-200" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function VendorBookings() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bookings, isLoading } = useListMyBookings(
    statusFilter !== "all" ? { status: statusFilter as any } : {}
  );

  const list = (Array.isArray(bookings) ? bookings : []) as any[];

  const totalEarned = list
    .filter(b => b.status === "completed")
    .reduce((s: number, b: any) => s + Number(b.vendorPayoutAmount), 0);

  const inEscrow = list
    .filter(b => b.status === "in_escrow")
    .reduce((s: number, b: any) => s + Number(b.vendorPayoutAmount), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Loading..." : `${list.length} booking${list.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Earnings summary */}
      {!isLoading && list.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm border-emerald-100">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-emerald-700">KES {totalEarned.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">From completed bookings</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-primary/20">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">In Escrow</p>
              <p className="text-2xl font-bold text-primary">KES {inEscrow.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending release</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : list.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              When planners accept your quotes, bookings will appear here.
            </p>
            <Link href="/vendor/requests">
              <Button size="sm" variant="outline" className="mt-4">View Quote Requests</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((b: any) => {
            const cfg = STATUS_CONFIG[b.status] ?? { label: b.status, icon: Briefcase, className: "bg-muted text-muted-foreground" };
            const Icon = cfg.icon;
            const isDisputed = b.status === "disputed";

            return (
              <Card
                key={b.id}
                className={`shadow-sm transition-all hover:shadow-md ${isDisputed ? "border-red-200" : ""}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg flex-shrink-0 ${isDisputed ? "bg-red-50" : "bg-muted/50"}`}>
                      <Icon className={`h-5 w-5 ${isDisputed ? "text-red-500" : "text-muted-foreground"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <code className="text-xs font-mono text-muted-foreground">
                          #{b.id.slice(0, 8).toUpperCase()}
                        </code>
                        <Badge className={`text-xs ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                        {b.category && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {b.category.replace(/_/g, " ")}
                          </Badge>
                        )}
                        {isDisputed && (
                          <Badge className="bg-red-600 text-white text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" /> Under Review
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        {b.eventTitle && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="font-medium text-foreground">{b.eventTitle}</span>
                          </span>
                        )}
                        {b.eventDate && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(b.eventDate)}
                          </span>
                        )}
                        {b.plannerName && (
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {b.plannerName}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        Booked {formatDate(b.createdAt)}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold">KES {Number(b.vendorPayoutAmount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Your payout</p>
                      {b.status === "in_escrow" && (
                        <p className="text-xs text-primary font-medium mt-1">In escrow</p>
                      )}
                      {b.status === "completed" && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">Released ✓</p>
                      )}
                    </div>
                  </div>

                  {isDisputed && b.cancellationReason && (
                    <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      Dispute: {b.cancellationReason}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
