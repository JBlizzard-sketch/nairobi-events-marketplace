import { useParams, useLocation } from "wouter";
import { useGetBooking, useConfirmBooking, useCreateReview } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, CreditCard, Star } from "lucide-react";
import { useState } from "react";

const STATUS_COLORS: Record<string, any> = {
  pending: "outline",
  in_escrow: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: booking, isLoading, refetch } = useGetBooking(id ?? "");
  const confirmBooking = useConfirmBooking();
  const createReview = useCreateReview();

  const [confirming, setConfirming] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const b = booking as any;

  const handleConfirm = async () => {
    if (!b) return;
    setConfirming(true);
    await confirmBooking.mutateAsync({ bookingId: b.id, data: { paymentMethod: "mpesa" } as any });
    refetch();
    setConfirming(false);
  };

  const handleReview = async () => {
    if (!b) return;
    setSubmittingReview(true);
    await createReview.mutateAsync({
      data: {
        bookingId: b.id,
        rating,
        qualityRating: rating,
        punctualityRating: rating,
        valueRating: rating,
        comment,
        isNoShow: false,
      },
    });
    setSubmittingReview(false);
    setReviewOpen(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!b) return <div className="p-8 text-center text-muted-foreground">Booking not found.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Booking Details</h1>
        <div className="flex items-center gap-3 mt-2">
          <code className="text-sm text-muted-foreground">#{b.id.slice(0, 8).toUpperCase()}</code>
          <Badge variant={STATUS_COLORS[b.status] ?? "secondary"} className="capitalize">
            {b.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

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
        </CardContent>
      </Card>

      {b.status === "pending" && (
        <Card className="shadow-sm border-primary/30">
          <CardHeader><CardTitle>Confirm &amp; Pay</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm this booking to lock in your vendor. Funds will be held in escrow until event completion.
            </p>
            <Button
              size="lg"
              className="w-full font-semibold"
              onClick={handleConfirm}
              disabled={confirming}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {confirming ? "Processing..." : "Confirm & Pay via M-Pesa"}
            </Button>
          </CardContent>
        </Card>
      )}

      {b.status === "in_escrow" && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-5 flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-primary mb-1">Payment in Escrow</h3>
            <p className="text-sm text-muted-foreground">
              Your payment is secured. Funds will be released to the vendor after your event is completed successfully.
            </p>
            {b.stripePaymentIntentId && (
              <code className="text-xs text-muted-foreground block mt-2">{b.stripePaymentIntentId}</code>
            )}
          </div>
        </div>
      )}

      {b.status === "completed" && !reviewOpen && (
        <Button variant="outline" onClick={() => setReviewOpen(true)} className="w-full gap-2">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          Leave a Review
        </Button>
      )}

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
              <Textarea
                placeholder="Share your experience with this vendor..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleReview} disabled={submittingReview} className="flex-1 font-semibold">
                {submittingReview ? "Submitting..." : "Submit Review"}
              </Button>
              <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
