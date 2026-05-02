import { useParams } from "wouter";
import { Link } from "wouter";
import { useGetBooking } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, ShieldCheck, AlertTriangle, Clock, XCircle,
  Calendar, MapPin, Users, Building2, User, ArrowLeft,
  Banknote, Package, Printer,
} from "lucide-react";

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pending Payment",  color: "outline"     },
  confirmed:  { label: "Confirmed",        color: "default"     },
  in_escrow:  { label: "In Escrow",        color: "default"     },
  completed:  { label: "Completed",        color: "secondary"   },
  disputed:   { label: "Disputed",         color: "destructive" },
  cancelled:  { label: "Cancelled",        color: "destructive" },
  refunded:   { label: "Refunded",         color: "secondary"   },
};

const ESCROW_STEPS = [
  { key: "pending",   label: "Payment Received" },
  { key: "in_escrow", label: "In Escrow"        },
  { key: "completed", label: "Payout Released"  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
}
function formatKES(n: number | string) {
  return `KES ${Number(n).toLocaleString()}`;
}

// ── Escrow tracker (vendor read-only view) ─────────────────────────────────────

function EscrowTracker({ status }: { status: string }) {
  const stepIdx = ({ pending: 0, confirmed: 0, in_escrow: 1, completed: 2, disputed: 1 } as Record<string, number>)[status] ?? 0;
  const isDisputed = status === "disputed";

  return (
    <div className="flex items-center gap-0 py-2">
      {ESCROW_STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < stepIdx
                ? "bg-primary text-primary-foreground"
                : i === stepIdx
                  ? isDisputed
                    ? "bg-destructive text-destructive-foreground ring-4 ring-destructive/20"
                    : "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
            }`}>
              {i < stepIdx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i <= stepIdx ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {s.label}
            </span>
          </div>
          {i < ESCROW_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-5 mx-2 transition-all ${i < stepIdx ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading } = useGetBooking(id ?? "");

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const b = booking as any;

  if (!b) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="font-semibold mb-2">Booking not found</p>
        <Link href="/vendor/bookings">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Bookings
          </Button>
        </Link>
      </div>
    );
  }

  const meta = STATUS_META[b.status] ?? { label: b.status, color: "secondary" };
  const total = Number(b.totalAmount ?? 0);
  const fee = Number(b.platformFeeAmount ?? 0);
  const payout = Number(b.vendorPayoutAmount ?? 0);
  const isDisputed = b.status === "disputed";
  const isCompleted = b.status === "completed";
  const isInEscrow = b.status === "in_escrow";

  const handlePrint = () => window.print();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <Link href="/vendor/bookings">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> All Bookings
          </button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <code className="text-sm font-mono text-muted-foreground">
                #{b.id?.slice(0, 8).toUpperCase()}
              </code>
              <Badge variant={meta.color as any} className="capitalize">
                {meta.label}
              </Badge>
              {b.category && (
                <Badge variant="outline" className="capitalize text-xs">
                  {String(b.category).replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </div>
          {(isInEscrow || isCompleted) && (
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 self-start print:hidden">
              <Printer className="h-4 w-4" /> Print
            </Button>
          )}
        </div>
      </div>

      {/* ── Escrow tracker ─────────────────────────────────────────────────── */}
      {!["cancelled", "refunded"].includes(b.status) && (
        <Card className={`shadow-sm print:hidden ${isDisputed ? "border-destructive/40 bg-destructive/5" : isCompleted ? "border-emerald-200 bg-emerald-50/30" : "border-primary/20 bg-primary/5"}`}>
          <CardContent className="pt-5 pb-3">
            <div className="flex items-center gap-2 mb-4">
              {isCompleted
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                : isDisputed
                  ? <AlertTriangle className="h-5 w-5 text-destructive" />
                  : <ShieldCheck className="h-5 w-5 text-primary" />
              }
              <p className={`font-semibold text-sm ${isCompleted ? "text-emerald-700" : isDisputed ? "text-destructive" : "text-primary"}`}>
                {isCompleted
                  ? "Payout released — payment delivered to your account"
                  : isDisputed
                    ? "This booking is under dispute — our team is reviewing"
                    : isInEscrow
                      ? "Payment held in escrow — release on event delivery"
                      : "Awaiting payment from the planner"}
              </p>
            </div>
            <EscrowTracker status={b.status} />
          </CardContent>
        </Card>
      )}

      {/* ── Dispute note ───────────────────────────────────────────────────── */}
      {isDisputed && b.cancellationReason && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-destructive mb-1">Dispute raised</p>
                <p className="text-sm text-destructive/80">{b.cancellationReason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Payout breakdown ───────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-4 w-4 text-primary" />
            Payout Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quote total</span>
            <span className="font-medium">{formatKES(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform commission</span>
            <span className="text-muted-foreground">− {formatKES(fee)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span className={isCompleted ? "text-emerald-700" : ""}>
              {isCompleted ? "Amount paid to you" : "Your payout"}
            </span>
            <span className={isCompleted ? "text-emerald-700" : ""}>
              {formatKES(payout)}
            </span>
          </div>
          {isInEscrow && (
            <p className="text-xs text-primary font-medium pt-1">
              Held in escrow · Released when the planner confirms delivery
            </p>
          )}
          {isCompleted && (
            <p className="text-xs text-emerald-600 font-medium pt-1">
              Payment has been released from escrow.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Event details ──────────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {b.eventTitle && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Event</p>
                <p className="font-semibold">{b.eventTitle}</p>
              </div>
            )}
            {b.eventDate && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Date</p>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(b.eventDate)}
                </div>
              </div>
            )}
            {b.guestCount && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Guests</p>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {b.guestCount} expected
                </div>
              </div>
            )}
            {b.venue && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Venue</p>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {b.venue}
                </div>
              </div>
            )}
            {b.city && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">City</p>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {b.city}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Planner info ───────────────────────────────────────────────────── */}
      {(b.plannerName || b.plannerEmail) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {b.plannerName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="font-medium">{b.plannerName}</span>
              </div>
            )}
            {b.plannerEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{b.plannerEmail}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Line items ─────────────────────────────────────────────────────── */}
      {Array.isArray(b.lineItems) && b.lineItems.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Quote Line Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {b.lineItems.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.description}</p>
                    {(item.quantity > 1 || item.unitPrice > 0) && (
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × {formatKES(item.unitPrice)}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold ml-4 flex-shrink-0">{formatKES(item.total ?? item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2">
                <span>Total</span>
                <span>{formatKES(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Meta ───────────────────────────────────────────────────────────── */}
      <div className="text-xs text-muted-foreground space-y-1 pb-4">
        <p>Booked on {b.createdAt ? formatDate(b.createdAt) : "—"}</p>
        <p className="font-mono">Ref: #{b.id?.slice(0, 8).toUpperCase()}</p>
      </div>
    </div>
  );
}
