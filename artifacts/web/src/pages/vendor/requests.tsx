import { useState, useEffect } from "react";
import { useListMyQuoteRequests, useSubmitQuote } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Plus, Trash2, Users, MapPin, Calendar,
  Wallet, ChevronDown, ChevronUp, CheckCircle2, Timer,
} from "lucide-react";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ── Live countdown hook ────────────────────────────────────────────────────────
function useCountdown(expiresAt: string | null | undefined): { text: string; urgent: boolean } | null {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return { text: "Expired", urgent: true };
  const totalMins = Math.floor(diff / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const urgent = diff < 2 * 3_600_000;
  if (h > 0) return { text: `${h}h ${m}m left`, urgent };
  return { text: `${m}m left`, urgent: true };
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  requested: { label: "New Request", className: "bg-primary text-primary-foreground" },
  submitted: { label: "Quote Sent", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground" },
};

// ── Individual request card (needs its own component to call useCountdown) ────
function RequestCard({
  req,
  statusCfg,
  isExpanded,
  onExpand,
  onQuote,
}: {
  req: any;
  statusCfg: { label: string; className: string };
  isExpanded: boolean;
  onExpand: () => void;
  onQuote: () => void;
}) {
  const countdown = useCountdown(req.status === "requested" ? req.expiresAt : null);

  return (
    <Card className={`shadow-sm transition-all ${
      req.status === "requested" ? "border-primary/30 hover:border-primary/50 hover:shadow-md" : ""
    }`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title + status badges */}
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <h3 className="font-semibold text-base">{req.event?.title ?? "Event Brief"}</h3>
              <Badge className={`text-xs px-2 py-0.5 ${statusCfg.className}`}>
                {statusCfg.label}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {req.category?.replace(/_/g, " ")}
              </Badge>
            </div>

            {/* Event meta */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {req.event?.eventDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(req.event.eventDate).toLocaleDateString("en-KE", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              )}
              {req.event?.guestCount && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {req.event.guestCount} guests
                </span>
              )}
              {req.event?.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {req.event.venue}
                </span>
              )}
              {req.event?.budgetMax && (
                <span className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  Budget: KES {Number(req.event.budgetMax).toLocaleString()}
                </span>
              )}
            </div>

            {/* Live countdown pill */}
            {countdown && (
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-md px-2.5 py-1.5 mt-2.5 border ${
                countdown.urgent
                  ? "text-red-700 bg-red-50 border-red-200"
                  : "text-amber-700 bg-amber-50 border-amber-200"
              }`}>
                <Timer className="h-3 w-3" />
                {countdown.text}
              </div>
            )}

            {/* Expanded event description */}
            {isExpanded && req.event?.description && (
              <div className="mt-3 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 leading-relaxed">
                {req.event.description}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {req.status === "requested" && (
              <Button onClick={onQuote} className="font-semibold gap-2" size="sm">
                Submit Quote
              </Button>
            )}
            {req.status === "submitted" && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Quote sent
              </div>
            )}
            {req.event?.description && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground gap-1"
                onClick={onExpand}
              >
                {isExpanded
                  ? <><ChevronUp className="h-3 w-3" /> Less</>
                  : <><ChevronDown className="h-3 w-3" /> Brief</>}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VendorRequests() {
  const { data: requests, isLoading, refetch } = useListMyQuoteRequests({});
  const submitQuote = useSubmitQuote();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [depositPercent, setDepositPercent] = useState(30);
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [terms, setTerms] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const requestList = Array.isArray(requests) ? requests : [];
  const pendingCount = requestList.filter(r => (r as any).status === "requested").length;

  const updateLineItem = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems(items =>
      items.map((item, idx) => {
        if (idx !== i) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.total = Number(updated.quantity) * Number(updated.unitPrice);
        }
        return updated;
      })
    );
  };

  const totalAmount = lineItems.reduce((sum, i) => sum + i.total, 0);
  const depositAmount = Math.round((totalAmount * depositPercent) / 100);

  const openQuoteDialog = (req: any) => {
    setSelectedRequest(req);
    setLineItems([{ description: "", quantity: 1, unitPrice: 0, total: 0 }]);
    setDepositPercent(30);
    setInclusions("");
    setExclusions("");
    setTerms("Payment due 7 days before event. Cancellations within 14 days forfeit deposit.");
  };

  const handleSubmit = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await submitQuote.mutateAsync({
        requestId: selectedRequest.id,
        data: {
          totalAmount: String(totalAmount),
          currency: "KES",
          depositPercent,
          lineItems,
          inclusions: inclusions.split("\n").map(s => s.trim()).filter(Boolean),
          exclusions: exclusions.split("\n").map(s => s.trim()).filter(Boolean),
          terms,
        } as any,
      });
      setSelectedRequest(null);
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quote Requests</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading ? "Loading..." : (
            pendingCount > 0
              ? <span className="text-primary font-medium">{pendingCount} request{pendingCount !== 1 ? "s" : ""} awaiting your quote</span>
              : `${requestList.length} total request${requestList.length !== 1 ? "s" : ""}`
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : requestList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-20 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No requests yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Once your profile is approved, quote requests from event planners will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requestList.map((req: any) => {
            const statusCfg =
              STATUS_CONFIG[req.status] ?? { label: req.status, className: "bg-muted text-muted-foreground" };
            const isExpanded = expandedId === req.id;
            return (
              <RequestCard
                key={req.id}
                req={req}
                statusCfg={statusCfg}
                isExpanded={isExpanded}
                onExpand={() => setExpandedId(isExpanded ? null : req.id)}
                onQuote={() => openQuoteDialog(req)}
              />
            );
          })}
        </div>
      )}

      {/* Quote submission dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Quote</DialogTitle>
            <DialogDescription>
              {selectedRequest?.event?.title} · {selectedRequest?.category?.replace(/_/g, " ")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-1">
            {/* Line items */}
            <div>
              <Label className="mb-3 block font-semibold">Line Items</Label>
              <div className="space-y-2.5">
                {lineItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description (e.g. Buffet per person)"
                        value={item.description}
                        onChange={e => updateLineItem(i, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min={1}
                        value={item.quantity}
                        onChange={e => updateLineItem(i, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Unit price (KES)"
                        value={item.unitPrice || ""}
                        onChange={e => updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center h-10">
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.total > 0 ? `${(item.total / 1000).toFixed(0)}K` : "—"}
                      </span>
                    </div>
                    <div className="col-span-1">
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setLineItems(items => items.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2 text-xs"
                onClick={() =>
                  setLineItems(items => [...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add Line Item
              </Button>
            </div>

            {/* Total summary */}
            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Total Quote</span>
                <span className="text-primary text-xl">KES {totalAmount.toLocaleString()}</span>
              </div>
              {totalAmount > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Deposit Required</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={depositPercent}
                      onChange={e => setDepositPercent(parseInt(e.target.value) || 0)}
                      className="w-20 h-8 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                    <span className="text-sm font-medium">= KES {depositAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Inclusions & Exclusions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">
                  What's Included
                  <span className="text-xs text-muted-foreground ml-1.5 font-normal">one per line</span>
                </Label>
                <Textarea
                  placeholder={"Setup & breakdown\nWaiting staff (6 persons)\nServing equipment"}
                  value={inclusions}
                  onChange={e => setInclusions(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">
                  What's Excluded
                  <span className="text-xs text-muted-foreground ml-1.5 font-normal">one per line</span>
                </Label>
                <Textarea
                  placeholder={"Venue hire\nDrinks\nExtra hours beyond 8pm"}
                  value={exclusions}
                  onChange={e => setExclusions(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-2">
              <Label className="font-semibold">Terms &amp; Conditions</Label>
              <Textarea
                placeholder="Payment terms, cancellation policy, special conditions..."
                value={terms}
                onChange={e => setTerms(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>

            <Button
              className="w-full font-semibold h-12"
              onClick={handleSubmit}
              disabled={submitting || totalAmount === 0 || lineItems.every(i => !i.description.trim())}
            >
              {submitting ? "Submitting..." : `Submit Quote — KES ${totalAmount.toLocaleString()}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
