import { useParams } from "wouter";
import {
  useGetBooking,
  useCreatePaymentIntent,
  useConfirmBooking,
  useReleaseEscrow,
  useDisputeBooking,
  useCreateReview,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  CreditCard,
  Star,
  ShieldCheck,
  Unlock,
  AlertTriangle,
  Smartphone,
  Loader2,
  Clock,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending Payment", color: "outline", icon: <Clock className="h-4 w-4" /> },
  confirmed: { label: "Confirmed", color: "default", icon: <CheckCircle2 className="h-4 w-4" /> },
  in_escrow: { label: "In Escrow", color: "default", icon: <ShieldCheck className="h-4 w-4" /> },
  completed: { label: "Completed", color: "secondary", icon: <CheckCircle2 className="h-4 w-4" /> },
  disputed: { label: "Disputed", color: "destructive", icon: <AlertTriangle className="h-4 w-4" /> },
  cancelled: { label: "Cancelled", color: "destructive", icon: <XCircle className="h-4 w-4" /> },
  refunded: { label: "Refunded", color: "secondary", icon: <XCircle className="h-4 w-4" /> },
};

const ESCROW_STEPS = [
  { key: "pending", label: "Payment" },
  { key: "in_escrow", label: "Escrow Held" },
  { key: "completed", label: "Released" },
];

function EscrowTracker({ status }: { status: string }) {
  const stepIdx = { pending: 0, in_escrow: 1, completed: 2, disputed: 1 }[status] ?? 0;
  return (
    <div className="flex items-center gap-0 py-2">
      {ESCROW_STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1 last:flex-none">
          <div className={`flex flex-col items-center gap-1 flex-shrink-0`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < stepIdx ? "bg-primary text-primary-foreground" :
              i === stepIdx ? (status === "disputed" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground ring-4 ring-primary/20") :
              "bg-muted text-muted-foreground"
            }`}>
              {i < stepIdx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs whitespace-nowrap ${i <= stepIdx ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</span>
          </div>
          {i < ESCROW_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-5 mx-2 transition-all ${i < stepIdx ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: booking, isLoading, refetch } = useGetBooking(id ?? "");

  const createPI = useCreatePaymentIntent();
  const confirmBooking = useConfirmBooking();
  const releaseEscrow = useReleaseEscrow();
  const disputeBooking = useDisputeBooking();
  const createReview = useCreateReview();

  const [payMethod, setPayMethod] = useState<"card" | "mpesa" | null>(null);
  const [paying, setPaying] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const b = booking as any;

  // ── Payment flow ────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!b || !payMethod) return;
    setPaying(true);
    try {
      const pi = await createPI.mutateAsync({
        bookingId: b.id,
        data: { paymentMethod: payMethod },
      });
      // In production with real Stripe: use pi.clientSecret with Stripe Elements here.
      // For mock / M-Pesa: just confirm directly.
      await confirmBooking.mutateAsync({
        bookingId: b.id,
        data: { paymentIntentId: (pi as any).paymentIntentId },
      });
      refetch();
    } finally {
      setPaying(false);
    }
  };

  // ── Release escrow ──────────────────────────────────────────────────────────
  const handleRelease = async () => {
    if (!b) return;
    setReleasing(true);
    try {
      await releaseEscrow.mutateAsync({ bookingId: b.id });
      refetch();
    } finally {
      setReleasing(false);
    }
  };

  // ── Dispute ─────────────────────────────────────────────────────────────────
  const handleDispute = async () => {
    if (!b || disputeReason.length < 10) return;
    await disputeBooking.mutateAsync({ bookingId: b.id, data: { reason: disputeReason } });
    refetch();
  };

  // ── Review ──────────────────────────────────────────────────────────────────
  const handleReview = async () => {
    if (!b) return;
    setSubmittingReview(true);
    try {
      await createReview.mutateAsync({
        data: { bookingId: b.id, rating, qualityRating: rating, punctualityRating: rating, valueRating: rating, comment, isNoShow: false },
      });
      setReviewOpen(false);
      refetch();
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!b) return <div className="p-8 text-center text-muted-foreground">Booking not found.</div>;

  const meta = STATUS_META[b.status] ?? { label: b.status, color: "secondary", icon: null };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
        <div className="flex items-center gap-3 mt-2">
          <code className="text-sm text-muted-foreground">#{b.id.slice(0, 8).toUpperCase()}</code>
          <Badge variant={meta.color as any} className="capitalize flex items-center gap-1.5">
            {meta.icon}
            {meta.label}
          </Badge>
        </div>
      </div>

      {/* Escrow tracker */}
      {["pending", "in_escrow", "completed", "disputed"].includes(b.status) && (
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <EscrowTracker status={b.status} />
            {b.status === "disputed" && (
              <div className="mt-3 text-xs text-destructive bg-destructive/5 rounded-lg p-3 border border-destructive/20">
                <span className="font-semibold">Dispute in review.</span> Our team will contact both parties within 2 business days. Reason: {b.cancellationReason}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment summary */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vendor services total</span>
            <span className="font-semibold">KES {Number(b.totalAmount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform fee (10%)</span>
            <span>KES {Number(b.platformFeeAmount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vendor payout</span>
            <span>KES {Number(b.vendorPayoutAmount).toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary text-lg">KES {Number(b.totalAmount).toLocaleString()}</span>
          </div>
          {b.stripePaymentIntentId && (
            <p className="text-xs text-muted-foreground pt-1">
              Ref: <code className="font-mono">{b.stripePaymentIntentId}</code>
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── PENDING: payment method selection + form ── */}
      {b.status === "pending" && (
        <Card className="shadow-sm border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Confirm &amp; Pay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Choose a payment method. Funds are held securely in escrow until your event is completed.
            </p>

            {/* Method selector */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "mpesa", label: "M-Pesa", icon: <Smartphone className="h-5 w-5" />, sub: "Lipa Na M-Pesa" },
                { key: "card", label: "Card", icon: <CreditCard className="h-5 w-5" />, sub: "Visa / Mastercard" },
              ] as const).map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPayMethod(m.key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    payMethod === m.key
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div className={`mb-2 ${payMethod === m.key ? "text-primary" : "text-muted-foreground"}`}>{m.icon}</div>
                  <div className="font-semibold text-sm">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.sub}</div>
                </button>
              ))}
            </div>

            {/* M-Pesa form */}
            {payMethod === "mpesa" && (
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                <Label>M-Pesa Phone Number</Label>
                <Input placeholder="e.g. 0712 345 678" type="tel" />
                <p className="text-xs text-muted-foreground">
                  You will receive an STK push to authorise the payment of KES {Number(b.totalAmount).toLocaleString()}.
                </p>
              </div>
            )}

            {/* Card form */}
            {payMethod === "card" && (
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
                <Label>Card details</Label>
                <Input placeholder="Card number" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="MM / YY" />
                  <Input placeholder="CVC" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Secured by 256-bit SSL encryption. Your card details are never stored.
                </p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full font-semibold"
              onClick={handlePay}
              disabled={!payMethod || paying}
            >
              {paying ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>
              ) : payMethod === "mpesa" ? (
                <><Smartphone className="mr-2 h-4 w-4" />Send STK Push — KES {Number(b.totalAmount).toLocaleString()}</>
              ) : payMethod === "card" ? (
                <><CreditCard className="mr-2 h-4 w-4" />Pay KES {Number(b.totalAmount).toLocaleString()}</>
              ) : (
                "Select a payment method"
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Funds held in escrow — released only after event completion
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── IN ESCROW: release / dispute ── */}
      {b.status === "in_escrow" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 flex items-start gap-4">
            <ShieldCheck className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-primary mb-1">Payment Held in Escrow</h3>
              <p className="text-sm text-muted-foreground">
                KES {Number(b.totalAmount).toLocaleString()} is secured. Release funds once your event has been delivered successfully.
              </p>
            </div>
          </div>

          {/* Release */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full font-semibold gap-2" size="lg">
                <Unlock className="h-4 w-4" />
                Release Payment to Vendor
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Release escrow payment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will release KES {Number(b.vendorPayoutAmount).toLocaleString()} to the vendor and mark the booking as complete. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRelease} disabled={releasing}>
                  {releasing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Releasing…</> : "Yes, release payment"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Dispute */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
                <AlertTriangle className="h-4 w-4" />
                Raise a Dispute
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Raise a dispute</AlertDialogTitle>
                <AlertDialogDescription>
                  Describe the issue clearly. Our team will review and contact both parties within 2 business days. Funds remain in escrow until resolved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                className="my-2"
                placeholder="Describe what went wrong (min. 10 characters)…"
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                rows={4}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDispute}
                  disabled={disputeReason.length < 10 || disputeBooking.isPending}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Submit Dispute
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* ── COMPLETED: review prompt ── */}
      {b.status === "completed" && !reviewOpen && (
        <Card className="shadow-sm border-green-200 bg-green-50/40">
          <CardContent className="pt-5 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <div>
              <p className="font-semibold text-green-800">Event completed!</p>
              <p className="text-sm text-green-700/80 mt-0.5">Payment of KES {Number(b.vendorPayoutAmount).toLocaleString()} has been released to the vendor.</p>
            </div>
            <Button variant="outline" onClick={() => setReviewOpen(true)} className="gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              Leave a Review
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {reviewOpen && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Write a Review</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} onClick={() => setRating(i)} className="focus:outline-none">
                    <Star className={`h-8 w-8 transition-all ${i <= rating ? "fill-amber-400 text-amber-400 scale-110" : "text-muted-foreground/30 hover:text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Comment</Label>
              <Textarea placeholder="Share your experience with this vendor…" value={comment} onChange={e => setComment(e.target.value)} rows={4} />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleReview} disabled={submittingReview} className="flex-1 font-semibold">
                {submittingReview ? "Submitting…" : "Submit Review"}
              </Button>
              <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
