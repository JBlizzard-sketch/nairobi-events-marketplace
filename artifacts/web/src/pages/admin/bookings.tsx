import { useState } from "react";
import { useAdminListBookings, useAdminResolveDispute } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Briefcase, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  Clock, CreditCard, Building2, Calendar, User, Gavel, Download,
} from "lucide-react";

function exportBookingsCSV(bookings: any[]) {
  const headers = ["Ref", "Status", "Event", "Category", "Vendor", "Planner", "Amount (KES)", "Platform Fee (KES)", "Payout (KES)", "Booked Date"];
  const rows = bookings.map(b => [
    `#${b.id.slice(0, 8).toUpperCase()}`,
    b.status,
    b.eventTitle ?? "",
    b.category ?? "",
    b.vendorBusinessName ?? "",
    b.plannerName ?? "",
    Number(b.totalAmount ?? 0).toFixed(2),
    Number(b.platformFeeAmount ?? 0).toFixed(2),
    Number(b.vendorPayoutAmount ?? 0).toFixed(2),
    b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-KE") : "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

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

interface ResolveDialogProps {
  bookingId: string;
  bookingRef: string;
  open: boolean;
  onClose: () => void;
  onResolved: () => void;
}

function ResolveDisputeDialog({ bookingId, bookingRef, open, onClose, onResolved }: ResolveDialogProps) {
  const [resolution, setResolution] = useState<"completed" | "refunded">("completed");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const resolve = useAdminResolveDispute();

  const handleResolve = async () => {
    setSaving(true);
    try {
      await resolve.mutateAsync({
        bookingId,
        data: { resolution, adminNotes: adminNotes.trim() || undefined },
      });
      onResolved();
      onClose();
      setAdminNotes("");
    } catch {
      // error is surfaced by the mutation
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Gavel className="h-5 w-5 text-amber-700" />
            </div>
            <DialogTitle>Resolve Dispute</DialogTitle>
          </div>
          <DialogDescription>
            Booking <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">#{bookingRef}</code> is marked as disputed.
            Choose a resolution and add any admin notes. Both the planner and vendor will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="font-semibold">Resolution</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResolution("completed")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  resolution === "completed"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-border bg-card hover:border-emerald-300"
                }`}
              >
                <CheckCircle2 className={`h-5 w-5 mb-1 ${resolution === "completed" ? "text-emerald-600" : "text-muted-foreground"}`} />
                <p className="font-semibold text-sm">Completed</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vendor wins — payment released from escrow
                </p>
              </button>
              <button
                type="button"
                onClick={() => setResolution("refunded")}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  resolution === "refunded"
                    ? "border-orange-500 bg-orange-50"
                    : "border-border bg-card hover:border-orange-300"
                }`}
              >
                <XCircle className={`h-5 w-5 mb-1 ${resolution === "refunded" ? "text-orange-600" : "text-muted-foreground"}`} />
                <p className="font-semibold text-sm">Refunded</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Planner wins — funds returned to planner
                </p>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-notes" className="font-semibold">
              Admin Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="admin-notes"
              rows={3}
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              placeholder="Explain the resolution reason. This will be included in the notification to both parties."
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={saving}
            className={resolution === "refunded"
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }
          >
            <Gavel className="h-4 w-4 mr-1.5" />
            {saving ? "Resolving…" : `Mark as ${resolution === "completed" ? "Completed" : "Refunded"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [resolveBooking, setResolveBooking] = useState<{ id: string; ref: string } | null>(null);

  const { data, isLoading, refetch } = useAdminListBookings({
    status: statusFilter !== "all" ? statusFilter : undefined,
    page: 1,
    limit: 100,
  });

  const bookingList = (data?.bookings ?? []) as any[];

  const totalAmount = bookingList.reduce((s, b) => s + Number(b.totalAmount), 0);
  const totalFees = bookingList.reduce((s, b) => s + Number(b.platformFeeAmount), 0);
  const disputedCount = bookingList.filter(b => b.status === "disputed").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Bookings</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Loading..." : `${data?.total ?? 0} total bookings`}
          </p>
        </div>
        {bookingList.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
            onClick={() => exportBookingsCSV(bookingList)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
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
          <Card className={`shadow-sm ${disputedCount > 0 ? "border-red-200 bg-red-50/30" : "border-border"}`}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Disputes</p>
              <p className={`text-2xl font-bold ${disputedCount > 0 ? "text-red-600" : ""}`}>{disputedCount}</p>
              {disputedCount > 0 && (
                <p className="text-xs text-red-600 mt-0.5">Require resolution</p>
              )}
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

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-lg font-bold">KES {Number(b.totalAmount).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          Fee: KES {Number(b.platformFeeAmount).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Payout: KES {Number(b.vendorPayoutAmount).toLocaleString()}
                        </p>
                      </div>
                      {isDisputed && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5 bg-amber-600 hover:bg-amber-700"
                          onClick={() => setResolveBooking({ id: b.id, ref: b.id.slice(0, 8).toUpperCase() })}
                        >
                          <Gavel className="h-3.5 w-3.5" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Resolve dispute dialog */}
      {resolveBooking && (
        <ResolveDisputeDialog
          bookingId={resolveBooking.id}
          bookingRef={resolveBooking.ref}
          open={!!resolveBooking}
          onClose={() => setResolveBooking(null)}
          onResolved={() => refetch()}
        />
      )}
    </div>
  );
}
