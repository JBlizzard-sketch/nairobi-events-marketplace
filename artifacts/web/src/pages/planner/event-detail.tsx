import { useParams } from "wouter";
import { useGetEvent, useGetEventQuotes, useAcceptQuote, useRejectQuote } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, Calendar, MapPin, Users, Clock } from "lucide-react";
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

function QuoteCard({ quote, onAccept, onReject, accepting, rejecting }: any) {
  return (
    <div className={`rounded-lg border p-5 space-y-4 transition-all ${
      quote.status === "accepted" ? "border-primary bg-primary/5 shadow-sm" :
      quote.status === "rejected" ? "border-border opacity-50" :
      "hover:border-primary/40 hover:shadow-sm"
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-foreground">{quote.vendorId}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{quote.category.replace(/_/g, " ")} · v{quote.version}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            KES {Number(quote.totalAmount).toLocaleString()}
          </div>
          {quote.depositPercent && (
            <p className="text-xs text-muted-foreground">{quote.depositPercent}% deposit</p>
          )}
        </div>
      </div>

      {quote.lineItems && quote.lineItems.length > 0 && (
        <div className="space-y-1">
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
                  <li key={i} className="flex items-center gap-1 text-foreground"><CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />{inc}</li>
                ))}
              </ul>
            </div>
          )}
          {quote.exclusions?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Excludes</p>
              <ul className="text-xs space-y-0.5">
                {quote.exclusions.map((exc: string, i: number) => (
                  <li key={i} className="flex items-center gap-1 text-muted-foreground"><XCircle className="h-3 w-3 flex-shrink-0" />{exc}</li>
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
        <Badge className="w-full justify-center py-1">Accepted — Booking Created</Badge>
      )}
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
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!event) {
    return <div className="p-8 text-center text-muted-foreground">Event not found.</div>;
  }

  const e = event as any;
  const categories = quotesData ? Object.keys((quotesData as any).quotesByCategory ?? {}) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{e.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={(STATUS_COLORS[e.status] ?? "secondary") as any} className="capitalize">
              {e.status.replace(/_/g, " ")}
            </Badge>
            {e.isEmergency && <Badge variant="destructive">Emergency</Badge>}
          </div>
        </div>
      </div>

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
        <h2 className="text-xl font-bold mb-1">Quotes</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {e.status === "quotes_requested"
            ? "Your brief was sent to vendors. Expect quotes within 4 hours."
            : "Compare and accept the best quotes for your event."}
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
          <div className="space-y-8">
            {categories.map((category: string) => (
              <div key={category}>
                <h3 className="font-semibold text-lg capitalize mb-4 flex items-center gap-2">
                  {category.replace(/_/g, " ")}
                  <Badge variant="outline" className="text-xs">
                    {(quotesData as any).quotesByCategory[category].length} quote{(quotesData as any).quotesByCategory[category].length !== 1 ? "s" : ""}
                  </Badge>
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {(quotesData as any).quotesByCategory[category].map((q: any) => (
                    <QuoteCard
                      key={q.id}
                      quote={q}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      accepting={acting === q.id && acceptQuote.isPending}
                      rejecting={acting === q.id && rejectQuote.isPending}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
