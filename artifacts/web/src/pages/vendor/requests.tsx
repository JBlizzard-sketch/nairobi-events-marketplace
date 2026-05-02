import { useState } from "react";
import { useListMyQuoteRequests, useSubmitQuote } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, Trash2 } from "lucide-react";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function VendorRequests() {
  const { data: requests, isLoading, refetch } = useListMyQuoteRequests({});
  const submitQuote = useSubmitQuote();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0, total: 0 }]);
  const [depositPercent, setDepositPercent] = useState(30);
  const [terms, setTerms] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requestList = Array.isArray(requests) ? requests : [];

  const updateLineItem = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems(items => items.map((item, idx) => {
      if (idx !== i) return item;
      const updated = { ...item, [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        updated.total = Number(updated.quantity) * Number(updated.unitPrice);
      }
      return updated;
    }));
  };

  const totalAmount = lineItems.reduce((sum, i) => sum + i.total, 0);

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
          terms,
        } as any,
      });
      setSelectedRequest(null);
      refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_COLORS: Record<string, any> = {
    requested: "default",
    submitted: "secondary",
    expired: "destructive",
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Quote Requests</h1>
        <p className="text-muted-foreground mt-1">{requestList.length} total</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      ) : requestList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-20 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No requests yet</h3>
            <p className="text-muted-foreground text-sm">Quote requests from event planners will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requestList.map((req: any) => (
            <Card key={req.id} className="shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{req.event?.title ?? "Event Brief"}</h3>
                      <Badge variant={STATUS_COLORS[req.status] ?? "secondary"} className="capitalize">
                        {req.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="capitalize">{req.category?.replace(/_/g, " ")}</span>
                      {req.event?.guestCount && <span>{req.event.guestCount} guests</span>}
                      {req.event?.eventDate && (
                        <span>{new Date(req.event.eventDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
                      )}
                      {req.event?.venue && <span>{req.event.venue}</span>}
                    </div>
                    {req.event?.budgetMax && (
                      <p className="text-sm mt-1">
                        Budget: <span className="font-medium">KES {Number(req.event.budgetMax).toLocaleString()}</span>
                      </p>
                    )}
                    {req.expiresAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Deadline: {new Date(req.expiresAt).toLocaleString("en-KE")}
                      </p>
                    )}
                  </div>
                  {req.status === "requested" && (
                    <Button onClick={() => setSelectedRequest(req)} className="font-semibold flex-shrink-0">
                      Submit Quote
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Quote — {selectedRequest?.event?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div>
              <Label className="mb-3 block font-medium">Line Items</Label>
              <div className="space-y-3">
                {lineItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description"
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
                        placeholder="Unit price"
                        value={item.unitPrice || ""}
                        onChange={e => updateLineItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center h-10">
                      <span className="text-sm font-medium">{(item.total / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="col-span-1">
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 text-muted-foreground"
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
                className="mt-3 gap-2"
                onClick={() => setLineItems(items => [...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }])}
              >
                <Plus className="h-4 w-4" />
                Add Line
              </Button>
            </div>

            <div className="flex justify-between p-4 rounded-lg bg-muted/40 font-semibold">
              <span>Total</span>
              <span className="text-primary text-lg">KES {totalAmount.toLocaleString()}</span>
            </div>

            <div className="space-y-2">
              <Label>Deposit Required (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={depositPercent}
                onChange={e => setDepositPercent(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea
                placeholder="Payment terms, cancellation policy, inclusions..."
                value={terms}
                onChange={e => setTerms(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              className="w-full font-semibold"
              onClick={handleSubmit}
              disabled={submitting || totalAmount === 0}
            >
              {submitting ? "Submitting..." : `Submit Quote — KES ${totalAmount.toLocaleString()}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
