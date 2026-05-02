import { useParams } from "wouter";
import { useGetEvent, useGetEventQuotes, useAcceptQuote, useRejectQuote } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Calendar, MapPin, Users, Clock, Star, Trophy, TrendingDown, Circle } from "lucide-react";
import { useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  brief_submitted: "outline",
  quotes_requested: "outline",
  quotes_received: "default",
  vendor_selected: "default",
  booked: "default",
  completed: "secondary",
  cancelled: "destructive",
};

// ── Event lifecycle stepper ───────────────────────────────────────────────────
const EVENT_STEPS = [
  { key: "draft",           label: "Draft",           sub: "Brief created" },
  { key: "brief_submitted", label: "Brief Sent",       sub: "Vendors notified" },
  { key: "quotes_received", label: "Quotes In",        sub: "Compare & choose" },
  { key: "vendor_selected", label: "Vendor Chosen",    sub: "Ready to book" },
  { key: "booked",          label: "Booked",           sub: "Payment secured" },
  { key: "completed",       label: "Done",             sub: "Event complete" },
];

const STEP_ORDER = [
  "draft", "brief_submitted", "quotes_requested", "quotes_received",
  "vendor_selected", "booked", "completed",
];

function EventStepper({ status }: { status: string }) {
  const isCancelled = status === "cancelled";
  const currentIdx = STEP_ORDER.indexOf(status);

  return (
    <div className={`rounded-xl border p-5 ${isCancelled ? "border-destructive/30 bg-destructive/5" : "bg-muted/20"}`}>
      {isCancelled ? (
        <div className="flex items-center gap-2 text-destructive font-semibold">
          <XCircle className="h-5 w-5" />
          This event has been cancelled.
        </div>
      ) : (
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {EVENT_STEPS.map((step, i) => {
            const stepOrderIdx = STEP_ORDER.indexOf(step.key);
            const isDone = stepOrderIdx < currentIdx;
            const isActive = stepOrderIdx === currentIdx || (
              step.key === "quotes_received" && status === "quotes_requested"
            );
            const isFuture = !isDone && !isActive;

            return (
              <div key={step.key} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5 px-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
                      : "bg-muted border-2 border-border text-muted-foreground"
                  }`}>
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isActive ? (
                      <span className="text-xs font-bold">{i + 1}</span>
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="text-center min-w-0">
                    <p className={`text-xs font-semibold whitespace-nowrap ${
                      isDone || isActive ? "text-foreground" : "text-muted-foreground"
                    }`}>{step.label}</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">{step.sub}</p>
                  </div>
                </div>
                {i < EVENT_STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 flex-shrink-0 mx-1 -mt-5 transition-all ${
                    isDone ? "bg-primary" : "bg-border"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuoteCard({ quote, onAccept, onReject, accepting, rejecting, isBestValue, isLowest }: any) {
  return (
    <div className={`rounded-lg border p-5 space-y-4 transition-all relative ${
      quote.status === "accepted" ? "border-primary bg-primary/5 shadow-md" :
      quote.status === "rejected" ? "border-border opacity-50" :
      isBestValue ? "border-primary/60 hover:shadow-md bg-primary/3" :
      "hover:border-primary/30 hover:shadow-sm"
    }`}>
      {isBestValue && quote.status !== "rejected" && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-primary text-primary-foreground gap-1 shadow-sm text-xs">
            <Trophy className="h-3 w-3" /> Best Value
          </Badge>
        </div>
      )}
      {isLowest && !isBestValue && quote.status !== "rejected" && (
        <div className="absolute -top-3 left-4">
          <Badge variant="secondary" className="gap-1 text-xs">
            <TrendingDown className="h-3 w-3" /> Lowest Price
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground truncate">
            {quote.vendorBusinessName ?? "Unknown Vendor"}
          </h4>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground capitalize">
              {quote.category?.replace(/_/g, " ")}
            </span>
            {quote.vendorAverageRating && Number(quote.vendorAverageRating) > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-amber-600">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {Number(quote.vendorAverageRating).toFixed(1)}
                {quote.vendorTotalReviews > 0 && (
                  <span className="text-muted-foreground ml-0.5">({quote.vendorTotalReviews})</span>
                )}
              </span>
            )}
            {quote.vendorCity && (
              <span className="text-xs text-muted-foreground">{quote.vendorCity}</span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <div className="text-2xl font-bold text-foreground">
            KES {Number(quote.totalAmount).toLocaleString()}
          </div>
          {quote.depositPercent && (
            <p className="text-xs text-muted-foreground">{quote.depositPercent}% deposit</p>
          )}
        </div>
      </div>

      {quote.lineItems && quote.lineItems.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/40">
          {quote.lineItems.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.description} × {item.quantity}</span>
              <span className="font-medium">KES {Number(item.total).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {(quote.inclusions?.length > 0 || quote.exclusions?.length > 0) && (
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          {quote.inclusions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Includes</p>
              <ul className="text-xs space-y-0.5">
                {quote.inclusions.map((inc: string, i: number) => (
                  <li key={i} className="flex items-center gap-1 text-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />{inc}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {quote.exclusions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Excludes</p>
              <ul className="text-xs space-y-0.5">
                {quote.exclusions.map((exc: string, i: number) => (
                  <li key={i} className="flex items-center gap-1 text-muted-foreground">
                    <XCircle className="h-3 w-3 flex-shrink-0" />{exc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {quote.terms && (
        <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">{quote.terms}</p>
      )}

      {quote.status === "submitted" && (
        <div className="flex gap-3 pt-1">
          <Button
            size="sm"
            onClick={() => onAccept(quote.id)}
            disabled={accepting}
            className="flex-1 font-semibold"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Accept Quote
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(quote.id)}
            disabled={rejecting}
            className="flex-1"
          >
            Decline
          </Button>
        </div>
      )}

      {quote.status === "accepted" && (
        <Badge className="w-full justify-center py-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
          Accepted — Booking Created
        </Badge>
      )}
    </div>
  );
}

function QuoteCategorySection({ category, quotes, onAccept, onReject, acting, acceptIsPending, rejectIsPending }: any) {
  const submitted = quotes.filter((q: any) => q.status === "submitted");
  const lowestAmount = submitted.length > 0
    ? Math.min(...submitted.map((q: any) => Number(q.totalAmount)))
    : null;

  // Best value = lowest price among submitted, with a rating boost tie-break
  const bestValue = submitted.length > 0
    ? submitted.reduce((best: any, q: any) => {
        const score = Number(q.totalAmount) * (1 - Math.min(Number(q.vendorAverageRating ?? 0) * 0.01, 0.1));
        const bestScore = Number(best.totalAmount) * (1 - Math.min(Number(best.vendorAverageRating ?? 0) * 0.01, 0.1));
        return score < bestScore ? q : best;
      })
    : null;

  const totalAccepted = quotes
    .filter((q: any) => q.status === "accepted")
    .reduce((sum: number, q: any) => sum + Number(q.totalAmount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
          {category.replace(/_/g, " ")}
          <Badge variant="outline" className="text-xs">
            {quotes.length} quote{quotes.length !== 1 ? "s" : ""}
          </Badge>
        </h3>
        {totalAccepted > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Accepted: KES {totalAccepted.toLocaleString()}
          </span>
        )}
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {quotes.map((q: any) => (
          <QuoteCard
            key={q.id}
            quote={q}
            onAccept={onAccept}
            onReject={onReject}
            accepting={acting === q.id && acceptIsPending}
            rejecting={acting === q.id && rejectIsPending}
            isBestValue={bestValue?.id === q.id && submitted.length > 1}
            isLowest={lowestAmount !== null && Number(q.totalAmount) === lowestAmount && submitted.length > 1 && bestValue?.id !== q.id}
          />
        ))}
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading: loadingEvent } = useGetEvent(id ?? "");
  const { data: quotesData, isLoading: loadingQuotes, refetch } = useGetEventQuotes(id ?? "");
  const acceptQuote = useAcceptQuote();
  const rejectQuote = useRejectQuote();
  const [acting, setActing] = useState<string | null>(null);

  const handleAccept = async (quoteId: string) => {
    setActing(quoteId);
    await acceptQuote.mutateAsync({ quoteId });
    refetch();
    setActing(null);
  };

  const handleReject = async (quoteId: string) => {
    setActing(quoteId);
    await rejectQuote.mutateAsync({ quoteId });
    refetch();
    setActing(null);
  };

  if (loadingEvent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (!event) {
    return <div className="p-8 text-center text-muted-foreground">Event not found.</div>;
  }

  const e = event as any;
  const categories = quotesData ? Object.keys((quotesData as any).quotesByCategory ?? {}) : [];

  // Total cost of all accepted quotes across all categories
  const allQuotes = categories.flatMap(cat => (quotesData as any).quotesByCategory[cat]);
  const totalAccepted = allQuotes
    .filter((q: any) => q.status === "accepted")
    .reduce((sum: number, q: any) => sum + Number(q.totalAmount), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{e.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant={(STATUS_COLORS[e.status] ?? "secondary") as any} className="capitalize">
              {e.status.replace(/_/g, " ")}
            </Badge>
            {e.isEmergency && <Badge variant="destructive">Emergency</Badge>}
          </div>
        </div>
        {totalAccepted > 0 && (
          <Card className="shadow-sm border-primary/30 bg-primary/5 flex-shrink-0">
            <CardContent className="px-4 py-3">
              <p className="text-xs text-primary font-semibold uppercase tracking-wider">Total Committed</p>
              <p className="text-xl font-bold">KES {totalAccepted.toLocaleString()}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <EventStepper status={e.status} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Calendar, label: "Date", value: new Date(e.eventDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) },
          { icon: MapPin, label: "Venue", value: `${e.venue ?? "TBD"}, ${e.city ?? "Nairobi"}` },
          { icon: Users, label: "Guests", value: `${e.guestCount} expected` },
          { icon: Clock, label: "Budget", value: e.budgetMax ? `KES ${Number(e.budgetMax).toLocaleString()}` : "Flexible" },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-md flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
                <p className="text-sm font-semibold truncate mt-0.5">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div>
        <div className="flex items-end justify-between mb-2">
          <h2 className="text-xl font-bold">Quotes</h2>
          {categories.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Sorted by price · Best Value highlighted
            </p>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {e.status === "quotes_requested"
            ? "Your brief was sent to vendors. Expect quotes within 4 hours."
            : "Compare and accept the best quotes for each service category."}
        </p>

        {loadingQuotes ? (
          <div className="space-y-6">
            {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
          </div>
        ) : categories.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-3 opacity-60" />
              <h3 className="font-semibold mb-1">No quotes yet</h3>
              <p className="text-muted-foreground text-sm">Your brief was sent to vetted vendors. Quotes will arrive within 4 hours.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {categories.map((category: string) => (
              <QuoteCategorySection
                key={category}
                category={category}
                quotes={(quotesData as any).quotesByCategory[category]}
                onAccept={handleAccept}
                onReject={handleReject}
                acting={acting}
                acceptIsPending={acceptQuote.isPending}
                rejectIsPending={rejectQuote.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
