import { useState } from "react";
import { useListMyEvents, useListMyBookings } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Calendar as CalendarIcon, Clock, ChevronRight, FileText,
  Sparkles, Plus, ArrowRight, CheckCircle2, AlertCircle,
  Briefcase, TrendingUp, X, ShieldCheck, Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const WELCOME_DISMISSED_KEY = "nairobi_welcome_dismissed";

function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  const steps = [
    { icon: FileText, label: "Create an event brief", desc: "Tell us what you need in 2 minutes" },
    { icon: AlertCircle, label: "Receive 3 competing quotes", desc: "Vetted vendors respond within 4 hours" },
    { icon: ShieldCheck, label: "Book securely with escrow", desc: "Pay only when you're satisfied" },
  ];

  return (
    <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Welcome to Nairobi Events</CardTitle>
            <CardDescription className="mt-1">Here's how it works — get started in minutes.</CardDescription>
          </div>
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pb-5">
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          {steps.map(({ icon: Icon, label, desc }, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                {i + 1}
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Link href="/events/new">
            <Button size="sm" className="gap-2 font-semibold shadow-sm">
              <Plus className="h-4 w-4" />
              Create Your First Event
            </Button>
          </Link>
          <Link href="/vendors">
            <Button size="sm" variant="outline">Browse Vendors</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

const EVENT_STATUS_BADGE: Record<string, { label: string; variant: any; className?: string }> = {
  draft: { label: "Draft", variant: "outline" },
  brief_submitted: { label: "Brief Sent", variant: "outline" },
  quotes_requested: { label: "Awaiting Quotes", variant: "outline", className: "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:bg-amber-950/30" },
  quotes_received: { label: "Quotes Ready", variant: "default", className: "bg-primary text-primary-foreground" },
  vendor_selected: { label: "Vendor Chosen", variant: "secondary" },
  booked: { label: "Booked", variant: "secondary", className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatEventDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function PlannerDashboard() {
  const { data: events, isLoading: loadingEvents } = useListMyEvents({ limit: 10 });
  const { data: bookings, isLoading: loadingBookings } = useListMyBookings({});
  const [welcomeDismissed, setWelcomeDismissed] = useState(
    () => localStorage.getItem(WELCOME_DISMISSED_KEY) === "1"
  );

  const handleDismissWelcome = () => {
    localStorage.setItem(WELCOME_DISMISSED_KEY, "1");
    setWelcomeDismissed(true);
  };

  const eventList = events?.events ?? [];
  const bookingList = Array.isArray(bookings) ? bookings : [];

  const activeEvents = eventList.filter(e => !["completed", "cancelled"].includes(e.status));
  const quotesReady = eventList.filter(e => e.status === "quotes_received");
  const awaitingQuotes = eventList.filter(e => e.status === "quotes_requested");
  const confirmedBookings = bookingList.filter((b: any) => ["confirmed", "in_escrow", "completed"].includes(b.status));

  // Next upcoming event (future dates, sorted ascending)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = eventList
    .filter(e => new Date(e.eventDate) >= today && !["completed", "cancelled"].includes(e.status))
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  const nextEvent = upcomingEvents[0];
  const daysToNext = nextEvent ? daysUntil(nextEvent.eventDate) : null;

  // Next steps — real actions based on event state
  const nextSteps: Array<{ label: string; href: string; icon: any; color: string }> = [];
  if (quotesReady.length > 0) {
    quotesReady.forEach(e => nextSteps.push({
      label: `Review ${quotesReady.length > 1 ? `${quotesReady.length} events with ` : ""}quotes for ${e.title}`,
      href: `/events/${e.id}`,
      icon: AlertCircle,
      color: "text-primary",
    }));
  }
  if (eventList.length === 0) {
    nextSteps.push({ label: "Create your first event brief", href: "/events/new", icon: Plus, color: "text-primary" });
  }
  if (nextSteps.length < 3) {
    nextSteps.push({ label: "Explore the vendor directory", href: "/vendors", icon: FileText, color: "text-muted-foreground" });
  }
  if (nextSteps.length < 3) {
    nextSteps.push({ label: "Optimise your budget with AI", href: "/budget", icon: Sparkles, color: "text-muted-foreground" });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            {loadingEvents ? "Loading your events..." : "Welcome back. Here's what's happening."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/budget">
            <Button variant="outline" className="gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Budget AI
            </Button>
          </Link>
          <Link href="/events/new">
            <Button className="font-semibold shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* First-run welcome banner */}
      {!loadingEvents && !welcomeDismissed && eventList.length === 0 && (
        <WelcomeBanner onDismiss={handleDismissWelcome} />
      )}

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Events</p>
                <p className="text-3xl font-bold mt-0.5">
                  {loadingEvents ? <Skeleton className="h-8 w-10 inline-block" /> : activeEvents.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`shadow-sm ${quotesReady.length > 0 ? "border-primary/40 bg-primary/3" : ""}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={`${quotesReady.length > 0 ? "bg-primary/15" : "bg-muted"} p-2.5 rounded-lg`}>
                <AlertCircle className={`h-5 w-5 ${quotesReady.length > 0 ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quotes Ready</p>
                <p className={`text-3xl font-bold mt-0.5 ${quotesReady.length > 0 ? "text-primary" : ""}`}>
                  {loadingEvents ? <Skeleton className="h-8 w-10 inline-block" /> : quotesReady.length}
                </p>
              </div>
            </div>
            {quotesReady.length > 0 && (
              <p className="text-xs text-primary font-medium mt-2">Awaiting your review</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Awaiting Quotes</p>
                <p className="text-3xl font-bold mt-0.5">
                  {loadingEvents ? <Skeleton className="h-8 w-10 inline-block" /> : awaitingQuotes.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg">
                <Briefcase className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bookings</p>
                <p className="text-3xl font-bold mt-0.5">
                  {loadingBookings ? <Skeleton className="h-8 w-10 inline-block" /> : confirmedBookings.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next event countdown banner */}
      {!loadingEvents && nextEvent && daysToNext !== null && daysToNext <= 30 && (
        <Link href={`/events/${nextEvent.id}`}>
          <div className={`rounded-xl border p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all ${
            daysToNext <= 7 ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20" :
            daysToNext <= 14 ? "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20" :
            "border-primary/20 bg-primary/5"
          }`}>
            <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center font-black ${
              daysToNext <= 7 ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" :
              daysToNext <= 14 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" :
              "bg-primary/10 text-primary"
            }`}>
              <span className="text-2xl leading-none">{daysToNext}</span>
              <span className="text-xs font-semibold">days</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{nextEvent.title}</p>
              <p className="text-sm text-muted-foreground">{formatEventDate(nextEvent.eventDate)} · {(nextEvent as any).venue ?? "Venue TBD"}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent events — takes 2 cols */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Your latest event briefs</CardDescription>
            </div>
            <Link href="/events">
              <Button variant="outline" size="sm" className="gap-1">View All <ChevronRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-18 w-full rounded-lg" />)}
              </div>
            ) : eventList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center border rounded-xl bg-muted/20 border-dashed">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No events yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-4">
                  Create your first event brief and receive competing quotes from vetted vendors within 4 hours.
                </p>
                <Link href="/events/new">
                  <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Create Event</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {eventList.slice(0, 6).map((event) => {
                  const statusInfo = EVENT_STATUS_BADGE[event.status] ?? { label: event.status, variant: "outline" };
                  const days = daysUntil(event.eventDate);
                  return (
                    <Link key={event.id} href={`/events/${event.id}`}>
                      <div className="flex items-center justify-between p-3.5 rounded-xl border hover:border-primary/40 transition-all cursor-pointer hover:bg-muted/20 group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="bg-muted group-hover:bg-primary/10 p-2 rounded-lg transition-colors flex-shrink-0">
                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{event.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatEventDate(event.eventDate)}
                              {days >= 0 && days <= 60 && ` · ${days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days}d`}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                          <Badge
                            variant={statusInfo.variant}
                            className={`text-xs ${statusInfo.className ?? ""}`}
                          >
                            {statusInfo.label}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Next Steps */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Next Steps</CardTitle>
              <CardDescription>Actions for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {nextSteps.slice(0, 3).map(({ label, href, icon: Icon, color }, i) => (
                <Link key={i} href={href}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="bg-muted group-hover:bg-muted/80 p-1.5 rounded-md flex-shrink-0">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    <span className="text-sm font-medium truncate">{label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
              {quotesReady.length === 0 && awaitingQuotes.length === 0 && activeEvents.length === 0 && (
                <div className="flex items-center gap-2 p-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  All caught up!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming confirmed bookings */}
          {(() => {
            const upcoming = bookingList
              .filter((b: any) =>
                ["confirmed", "in_escrow"].includes(b.status) &&
                b.eventDate &&
                new Date(b.eventDate) >= today
              )
              .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
              .slice(0, 3);
            if (loadingBookings || upcoming.length === 0) return null;
            return (
              <Card className="shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Upcoming Bookings
                    </CardTitle>
                  </div>
                  <Link href="/bookings">
                    <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</span>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {upcoming.map((b: any) => {
                    const days = daysUntil(b.eventDate);
                    const isUrgent = days <= 3;
                    const isSoon = days <= 7;
                    return (
                      <Link key={b.id} href={`/bookings/${b.id}`}>
                        <div className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                          isUrgent ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20" :
                          isSoon ? "border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20" :
                          "border-border hover:border-primary/30 hover:bg-muted/30"
                        }`}>
                          <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs font-black leading-none ${
                            isUrgent ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" :
                            isSoon ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" :
                            "bg-primary/10 text-primary"
                          }`}>
                            <span className="text-base">{days === 0 ? "!" : days}</span>
                            <span className="text-[9px] font-semibold">{days === 0 ? "Today" : "days"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{(b as any).eventTitle ?? "Event"}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {(b as any).vendorBusinessName ?? "Vendor"}
                            </p>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })()}

          {/* Quick shortcuts */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/events/new", icon: Plus, label: "New Event Brief" },
                { href: "/vendors", icon: Building2, label: "Browse Vendors" },
                { href: "/budget", icon: Sparkles, label: "AI Budget Planner" },
                { href: "/bookings", icon: Briefcase, label: "My Bookings" },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="font-medium">{label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
