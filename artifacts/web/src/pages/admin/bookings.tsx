import { useState } from "react";
import { useAdminListBookings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  Clock, CreditCard, Building2, Calendar, User,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; icon: any; className: string }> = {
  pending: { label: "Pending Payment", icon: Clock, className: "bg-muted text-muted-foreground" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, className: "bg-blue-100 text-blue-800 border-blue-200" },
  in_escrow: { label: "In Escrow", icon: ShieldCheck, className: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  disputed: { label: "Disputed", icon: AlertTriangle, className: "bg-red-100 text-red-800 border-red-200" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-muted text-muted-foreground" },
  refunded: { label: "Refunded", icon: XCircle, className: "bg-orange-100 text-orange-800 border-orange-200" },
};

const STATUS_OPTIONS = ["pending", "confirmed", "in_escrow", "completed", "disputed", "cancelled", "refunded"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useAdminListBookings({
    status: statusFilter !== "all" ? statusFilter : undefined,
    page: 1,
    limit: 100,
  });

  const bookingList = (data?.bookings ?? []) as any[];

  // Totals
  const totalAmount = bookingList.reduce((s, b) => s + Number(b.totalAmount), 0);
  const totalFees = bookingList.reduce((s, b) => s + Number(b.platformFeeAmount), 0);
  const disputedCount = bookingList.filter(b => b.status === "disputed").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Bookings</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading ? "Loading..." : `${data?.total ?? 0} total bookings`}
        </p>
      </div>

      {/* Summary cards */}
      {!isLoading && bookingList.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-sm border-emerald-100">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Volume</p>
              <p className="text-2xl font-bold">KES {totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-primary/20">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Platform Fees</p>
              <p className="text-2xl font-bold text-primary">KES {totalFees.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className={`shadow-sm ${disputedCount > 0 ? "border-red-200" : "border-border"}`}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Disputes</p>
              <p className={`text-2xl font-bold ${disputedCount > 0 ? "text-red-600" : ""}`}>{disputedCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status filter chips */}
      {!isLoading && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all bg-muted text-muted-foreground hover:opacity-100 ${
              statusFilter === "all" ? "ring-2 ring-offset-1 ring-primary/40 opacity-100" : "opacity-70"
            }`}
          >
            All · {data?.total ?? 0}
          </button>
          {STATUS_OPTIONS.map(s => {
            const cfg = STATUS_CONFIG[s];
            const count = bookingList.filter(b => b.status === s).length;
            if (statusFilter !== "all" && count === 0 && s !== statusFilter) return null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${cfg.className} ${
                  statusFilter === s ? "ring-2 ring-offset-1 ring-primary/40 shadow-sm" : "opacity-70 hover:opacity-100"
                }`}
              >
                {cfg.label}{statusFilter === "all" && count > 0 ? ` · ${count}` : ""}
              </button>
            );
          })}
        </div>
      )}

      {/* Status dropdown for cleaner selection when filtered */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUS_OPTIONS.map(s => (
            <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Booking list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : bookingList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold mb-1">No bookings found</h3>
            <p className="text-sm text-muted-foreground">Try changing the status filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookingList.map((b: any) => {
            const cfg = STATUS_CONFIG[b.status] ?? { label: b.status, icon: Briefcase, className: "bg-muted text-muted-foreground" };
            const Icon = cfg.icon;
            const isDisputed = b.status === "disputed";

            return (
              <Card key={b.id} className={`shadow-sm ${isDisputed ? "border-red-200 bg-red-50/30" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`p-2.5 rounded-lg flex-shrink-0 ${isDisputed ? "bg-red-100" : "bg-muted/60"}`}>
                        <Icon className={`h-5 w-5 ${isDisputed ? "text-red-600" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <code className="text-xs font-mono text-muted-foreground">
                            #{b.id.slice(0, 8).toUpperCase()}
                          </code>
                          <Badge className={`text-xs ${cfg.className}`}>
                            {cfg.label}
                          </Badge>
                          {isDisputed && (
                            <Badge className="bg-red-600 text-white text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" /> Needs Review
                            </Badge>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                          {b.eventTitle && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="font-medium text-foreground truncate">{b.eventTitle}</span>
                            </span>
                          )}
                          {b.vendorBusinessName && (
                            <span className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{b.vendorBusinessName}</span>
                              {b.category && <span className="capitalize text-xs">({b.category.replace(/_/g, " ")})</span>}
                            </span>
                          )}
                          {b.plannerName && (
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{b.plannerName}</span>
                            </span>
                          )}
                          {b.eventDate && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                              Event: {formatDate(b.eventDate)}
                            </span>
                          )}
                        </div>

                        {isDisputed && b.cancellationReason && (
                          <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">
                            Dispute reason: {b.cancellationReason}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          Booked {formatDate(b.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold">KES {Number(b.totalAmount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Fee: KES {Number(b.platformFeeAmount).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Payout: KES {Number(b.vendorPayoutAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
