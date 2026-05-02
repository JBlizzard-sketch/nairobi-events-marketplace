import { useParams } from "wouter";
import { useGetEvent, useGetEventQuotes, useAcceptQuote, useRejectQuote } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Calendar, MapPin, Users, Clock, Star, Trophy, TrendingDown, Circle, Pencil, CheckCheck, FileText, DollarSign, ThumbsUp, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

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

// ── Live 4-hour quote deadline countdown ──────────────────────────────────────
function QuoteCountdown({ submittedAt }: { submittedAt: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  const deadline = new Date(submittedAt).getTime() + 4 * 3_600_000;
  const diff = deadline - now;

  if (diff <= 0) {
    return (
      <div className="rounded-xl border border-muted bg-muted/30 p-4 flex items-center gap-3">
        <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <span className="text-sm text-muted-foreground font-medium">
          Quote window closed — vendors may still be preparing responses.
        </span>
      </div>
    );
  }

  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);

  const isCritical = diff < 15 * 60_000;
  const isUrgent = diff < 60 * 60_000;

  const borderBg = isCritical
    ? "border-red-200 bg-red-50"
    : isUrgent
    ? "border-amber-200 bg-amber-50"
    : "border-emerald-200 bg-emerald-50";

  const monoColor = isCritical ? "text-red-700" : isUrgent ? "text-amber-700" : "text-emerald-700";
  const dotColor = isCritical ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-emerald-500";
  const pingColor = isCritical ? "bg-red-400" : isUrgent ? "bg-amber-400" : "bg-emerald-400";
  const labelColor = isCritical ? "text-red-600" : isUrgent ? "text-amber-600" : "text-emerald-600";

  return (
    <div className={`rounded-xl border p-5 ${borderBg} transition-colors`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3 flex-shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`} />
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
              Quote Deadline
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vendors must submit by{" "}
              {new Date(deadline).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
              {" "}today
            </p>
          </div>
        </div>
        <div className={`font-mono text-4xl font-black tracking-tight tabular-nums ${monoColor}`}>
          {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </div>
      </div>
      {isCritical && (
        <p className="text-xs text-red-600 font-medium mt-3 border-t border-red-200 pt-3">
          Final 15 minutes — if vendors miss this window, the request will be extended automatically.
        </p>
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

  const handlePrintBrief = () => {
    const e = event as any;
    const services = (e.servicesNeeded ?? [])
      .map((s: string) => `<li style="margin:2px 0">${s.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</li>`)
      .join("");
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Event Brief — ${e.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; background: #fff; padding: 48px; max-width: 720px; margin: 0 auto; }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
    .logo-mark { width: 32px; height: 32px; background: #d97706; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 16px; }
    .logo-text { font-size: 14px; font-weight: 600; color: #555; }
    h1 { font-size: 28px; font-weight: 800; line-height: 1.2; margin-bottom: 6px; }
    .status-row { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
    .badge { display: inline-block; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 3px 10px; font-size: 11px; font-weight: 600; text-transform: capitalize; color: #374151; }
    .badge.emergency { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field label { font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 3px; }
    .field .value { font-size: 14px; font-weight: 600; color: #111; }
    ul { padding-left: 18px; margin-top: 4px; }
    ul li { font-size: 14px; color: #111; font-weight: 500; }
    .notes { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; font-size: 13px; line-height: 1.6; color: #374151; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print { body { padding: 32px; } }
  </style>
</head>
<body>
  <div class="logo">
    <div class="logo-mark">N</div>
    <span class="logo-text">Nairobi Events Marketplace — Event Brief</span>
  </div>

  <h1>${e.title}</h1>
  <div class="status-row">
    <span class="badge">${(e.status ?? "").replace(/_/g, " ")}</span>
    ${e.isEmergency ? '<span class="badge emergency">Emergency</span>' : ""}
    ${e.eventType ? `<span class="badge">${e.eventType.replace(/_/g, " ")}</span>` : ""}
  </div>

  <div class="section">
    <div class="section-title">Event Details</div>
    <div class="grid">
      <div class="field"><label>Date</label><div class="value">${new Date(e.eventDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</div></div>
      <div class="field"><label>Guest Count</label><div class="value">${e.guestCount} expected</div></div>
      <div class="field"><label>Venue</label><div class="value">${e.venue ?? "TBD"}</div></div>
      <div class="field"><label>City</label><div class="value">${e.city ?? "Nairobi"}</div></div>
      ${e.budgetMin ? `<div class="field"><label>Min Budget</label><div class="value">KES ${Number(e.budgetMin).toLocaleString()}</div></div>` : ""}
      ${e.budgetMax ? `<div class="field"><label>Max Budget</label><div class="value">KES ${Number(e.budgetMax).toLocaleString()}</div></div>` : ""}
    </div>
  </div>

  ${services ? `<div class="section"><div class="section-title">Services Needed</div><ul>${services}</ul></div>` : ""}

  ${e.description ? `<div class="section"><div class="section-title">Brief Notes</div><div class="notes">${e.description}</div></div>` : ""}

  <div class="footer">
    <span>Generated ${new Date().toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</span>
    <span>Nairobi Events Marketplace · events.co.ke</span>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
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
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrintBrief}>
            <Printer className="h-3.5 w-3.5" />
            Print Brief
          </Button>
          {e.status === "draft" && (
            <Link href={`/events/${e.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit Brief
              </Button>
            </Link>
          )}
          {totalAccepted > 0 && (
            <Card className="shadow-sm border-primary/30 bg-primary/5">
              <CardContent className="px-4 py-3">
                <p className="text-xs text-primary font-semibold uppercase tracking-wider">Total Committed</p>
                <p className="text-xl font-bold">KES {totalAccepted.toLocaleString()}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <EventStepper status={e.status} />

      {e.status === "quotes_requested" && e.updatedAt && (
        <QuoteCountdown submittedAt={e.updatedAt} />
      )}

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

      {/* ── Budget tracker ── */}
      {e.budgetMax && allQuotes.length > 0 && (() => {
        const budget = Number(e.budgetMax);
        const budgetMin = e.budgetMin ? Number(e.budgetMin) : 0;
        const lowestQuote = Math.min(...allQuotes.map((q: any) => Number(q.totalAmount)));
        const highestQuote = Math.max(...allQuotes.map((q: any) => Number(q.totalAmount)));
        const acceptedPct = Math.min((totalAccepted / budget) * 100, 100);
        const isOver = totalAccepted > budget;
        const barColor = isOver ? "bg-red-500" : totalAccepted > budget * 0.9 ? "bg-amber-500" : "bg-emerald-500";

        return (
          <Card className="shadow-sm">
            <CardContent className="pt-5 pb-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-sm">Budget Tracker</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>Budget: <span className="font-semibold text-foreground">KES {budget.toLocaleString()}</span></span>
                  {totalAccepted > 0 && (
                    <span className={`font-semibold ${isOver ? "text-red-600" : "text-emerald-600"}`}>
                      Committed: KES {totalAccepted.toLocaleString()} ({Math.round(acceptedPct)}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div className="relative">
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  {totalAccepted > 0 && (
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${Math.min(acceptedPct, 100)}%` }}
                    />
                  )}
                </div>
                {/* Budget max marker */}
                <div className="absolute top-0 right-0 h-3 w-0.5 bg-border" />
              </div>

              {/* Quote range row */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Lowest Quote</p>
                  <p className="text-sm font-semibold text-emerald-700">KES {lowestQuote.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Your Budget</p>
                  <p className="text-sm font-semibold">KES {budget.toLocaleString()}</p>
                  {budgetMin > 0 && (
                    <p className="text-xs text-muted-foreground">min KES {budgetMin.toLocaleString()}</p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Highest Quote</p>
                  <p className={`text-sm font-semibold ${highestQuote > budget ? "text-red-600" : "text-foreground"}`}>
                    KES {highestQuote.toLocaleString()}
                  </p>
                </div>
              </div>

              {isOver && (
                <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  Committed spend exceeds your stated budget. Consider revising your brief or adjusting the budget.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })()}

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

      {/* ── Activity Timeline ── */}
      {(() => {
        type Milestone = { icon: React.ReactNode; label: string; sub: string; done: boolean; accent?: string };

        const statusOrder = [
          "draft", "brief_submitted", "quotes_requested",
          "quotes_received", "vendor_selected", "booked", "completed",
        ];
        const idx = statusOrder.indexOf(e.status);

        const milestones: Milestone[] = [
          {
            icon: <FileText className="h-4 w-4" />,
            label: "Event brief created",
            sub: new Date(e.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }),
            done: idx >= 0,
          },
          {
            icon: <CheckCheck className="h-4 w-4" />,
            label: "Brief submitted to vendors",
            sub: "Vendors received your requirements",
            done: idx >= 1,
          },
          {
            icon: <Clock className="h-4 w-4" />,
            label: "Quotes requested",
            sub: "Vendors have up to 4 hours to respond",
            done: idx >= 2,
          },
          {
            icon: <Star className="h-4 w-4" />,
            label: "Quotes received",
            sub: `${allQuotes.length} quote${allQuotes.length !== 1 ? "s" : ""} available to compare`,
            done: idx >= 3,
          },
          {
            icon: <ThumbsUp className="h-4 w-4" />,
            label: "Vendor selected",
            sub: "Quote accepted — ready to confirm",
            done: idx >= 4,
          },
          {
            icon: <DollarSign className="h-4 w-4" />,
            label: "Booked & payment secured",
            sub: "Deposit held in escrow",
            done: idx >= 5,
            accent: "text-emerald-600",
          },
          {
            icon: <CheckCircle2 className="h-4 w-4" />,
            label: "Event completed",
            sub: e.status === "completed" ? "All done — leave a review!" : "Awaiting completion",
            done: idx >= 6,
            accent: "text-emerald-600",
          },
        ];

        // Only show the timeline if the event is past draft
        if (e.status === "draft") return null;

        return (
          <>
            <Separator />
            <div>
              <h2 className="text-xl font-bold mb-5">Activity Timeline</h2>
              <div className="relative">
                {/* Vertical rail */}
                <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                <ol className="space-y-5 pl-10">
                  {milestones.map((m, i) => (
                    <li key={i} className="relative">
                      {/* Dot */}
                      <div className={`absolute -left-[25px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                        m.done
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground/50"
                      }`}>
                        {m.icon}
                      </div>
                      <div className={`${m.done ? "opacity-100" : "opacity-40"}`}>
                        <p className={`text-sm font-semibold leading-none ${m.done && m.accent ? m.accent : ""}`}>
                          {m.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
