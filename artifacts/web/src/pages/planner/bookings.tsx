import { Link } from "wouter";
import { useListMyBookings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Briefcase, ChevronRight, ShieldCheck, CheckCircle2,
  XCircle, AlertTriangle, Clock, Calendar, Building2,
  Star, CreditCard, ArrowRight,
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

function formatKES(n: number) {
  return `KES ${n.toLocaleString()}`;
}

export default function BookingsList() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bookings, isLoading } = useListMyBookings(
    statusFilter !== "all" ? { status: statusFilter as any } : {}
  );

  const list = (Array.isArray(bookings) ? bookings : []) as any[];

  // Summary counts
  const pendingCount = list.filter(b => b.status === "pending").length;
  const inEscrowTotal = list
    .filter(b => b.status === "in_escrow")
    .reduce((s, b) => s + Number(b.totalAmount), 0);
  const reviewDueCount = list.filter(b => b.status === "completed").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Loading…" : `${list.length} booking${list.length !== 1 ? "s" : ""}`}
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

      {/* Summary stats bar */}
      {!isLoading && list.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className={`rounded-xl border p-4 ${pendingCount > 0 ? "border-amber-200 bg-amber-50" : "border-border bg-card"}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Payment</p>
            <p className={`text-2xl font-bold mt-1 ${pendingCount > 0 ? "text-amber-700" : "text-foreground"}`}>
              {pendingCount}
            </p>
            {pendingCount > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-0.5">Action required</p>
            )}
          </div>
          <div className={`rounded-xl border p-4 ${inEscrowTotal > 0 ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">In Escrow</p>
            <p className={`text-2xl font-bold mt-1 ${inEscrowTotal > 0 ? "text-primary" : "text-foreground"}`}>
              {inEscrowTotal > 0 ? `KES ${(inEscrowTotal / 1000).toFixed(0)}K` : "—"}
            </p>
            {inEscrowTotal > 0 && (
              <p className="text-xs text-primary/80 font-medium mt-0.5">Held securely</p>
            )}
          </div>
          <div className={`rounded-xl border p-4 ${reviewDueCount > 0 ? "border-amber-200 bg-amber-50" : "border-border bg-card"}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reviews Due</p>
            <p className={`text-2xl font-bold mt-1 ${reviewDueCount > 0 ? "text-amber-700" : "text-foreground"}`}>
              {reviewDueCount}
            </p>
            {reviewDueCount > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-0.5">Help future planners</p>
            )}
          </div>
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
              Accept a quote on one of your events to create your first booking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((booking: any) => {
            const cfg = STATUS_CONFIG[booking.status] ?? { label: booking.status, icon: Briefcase, className: "bg-muted text-muted-foreground" };
            const Icon = cfg.icon;
            const isDisputed = booking.status === "disputed";
            const isPending = booking.status === "pending";
            const isCompleted = booking.status === "completed";

            return (
              <div
                key={booking.id}
                className={`flex items-start justify-between p-5 rounded-xl border bg-card transition-all group ${
                  isDisputed
                    ? "border-red-200 bg-red-50/30"
                    : isPending
                    ? "border-amber-200 bg-amber-50/20 hover:border-amber-300 hover:shadow-sm"
                    : isCompleted
                    ? "border-emerald-100 hover:border-emerald-200 hover:shadow-sm"
                    : "hover:border-primary/40 hover:shadow-md"
                } cursor-pointer`}
              >
                <Link href={`/bookings/${booking.id}`} className="flex items-start gap-4 min-w-0 flex-1">
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${isDisputed ? "bg-red-100" : isPending ? "bg-amber-50" : "bg-muted/60"}`}>
                    <Icon className={`h-5 w-5 ${isDisputed ? "text-red-500" : isPending ? "text-amber-600" : "text-muted-foreground"}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        Booking #{booking.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <Badge className={`text-xs ${cfg.className}`}>
                        {cfg.label}
                      </Badge>
                      {isDisputed && (
                        <Badge className="bg-red-600 text-white text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" /> Under Review
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Review Due
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {booking.eventTitle && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">{booking.eventTitle}</span>
                        </span>
                      )}
                      {booking.vendorBusinessName && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {booking.vendorBusinessName}
                          {booking.category && (
                            <span className="text-xs capitalize">({booking.category.replace(/_/g, " ")})</span>
                          )}
                        </span>
                      )}
                      {booking.eventDate && (
                        <span className="text-xs">Event: {formatDate(booking.eventDate)}</span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1.5">
                      Booked {formatDate(booking.createdAt)}
                    </p>
                  </div>
                </Link>

                <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold">{formatKES(Number(booking.totalAmount))}</p>
                    <p className="text-xs text-muted-foreground">
                      Fee: {formatKES(Number(booking.platformFeeAmount))}
                    </p>
                  </div>

                  {/* Contextual action button */}
                  {isPending && (
                    <Link href={`/bookings/${booking.id}`}>
                      <Button size="sm" className="h-7 px-3 text-xs gap-1.5 font-semibold shadow-sm">
                        <CreditCard className="h-3.5 w-3.5" />
                        Pay Now
                      </Button>
                    </Link>
                  )}
                  {isCompleted && (
                    <Link href={`/bookings/${booking.id}`}>
                      <Button size="sm" variant="outline" className="h-7 px-3 text-xs gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        Leave Review
                      </Button>
                    </Link>
                  )}
                  {!isPending && !isCompleted && (
                    <Link href={`/bookings/${booking.id}`}>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
