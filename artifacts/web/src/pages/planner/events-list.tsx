import { useState } from "react";
import { Link } from "wouter";
import { useListMyEvents } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Calendar, ChevronRight, Plus, FileText, Pencil, CalendarDays, List, ChevronLeft, Search, X, AlertTriangle, Download } from "lucide-react";

function exportCSV(events: any[]) {
  const headers = ["Title", "Type", "Status", "Date", "Venue", "City", "Guests", "Budget Max"];
  const rows = events.map(e => [
    `"${(e.title ?? "").replace(/"/g, '""')}"`,
    e.eventType?.replace(/_/g, " ") ?? "",
    STATUS_LABELS[e.status] ?? e.status,
    e.eventDate ? new Date(e.eventDate).toLocaleDateString("en-KE") : "",
    `"${(e.venue ?? "").replace(/"/g, '""')}"`,
    e.city ?? "",
    e.guestCount ?? "",
    e.budgetMax ? Number(e.budgetMax).toLocaleString() : "",
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `events-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  brief_submitted: "Brief Submitted",
  quotes_requested: "Awaiting Quotes",
  quotes_received: "Quotes Ready",
  vendor_selected: "Vendor Chosen",
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<string, { variant: any; className?: string }> = {
  draft: { variant: "outline" },
  brief_submitted: { variant: "outline" },
  quotes_requested: { variant: "outline", className: "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:bg-amber-950/30" },
  quotes_received: { variant: "default", className: "bg-primary text-primary-foreground" },
  vendor_selected: { variant: "secondary" },
  booked: { variant: "secondary", className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50" },
  completed: { variant: "secondary" },
  cancelled: { variant: "destructive" },
};

// Calendar chip colours (simpler, more distinct per status)
const CAL_CHIP: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  brief_submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  quotes_requested: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  quotes_received: "bg-primary/90 text-primary-foreground",
  vendor_selected: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  booked: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  completed: "bg-slate-200 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300",
  cancelled: "bg-red-100 text-red-700 line-through dark:bg-red-900/30 dark:text-red-400",
};

const CHIP_FILTERS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "quotes_requested", label: "Awaiting Quotes" },
  { value: "quotes_received", label: "Quotes Ready" },
  { value: "booked", label: "Booked" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Month Calendar View ────────────────────────────────────────────────────────
function CalendarView({ events }: { events: any[] }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = month.getFullYear();
  const monthNum = month.getMonth();
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthNum, 1).getDay();
  const todayStr = new Date().toISOString().slice(0, 10);

  const eventMap: Record<string, any[]> = {};
  events.forEach(e => {
    const key = e.eventDate?.slice(0, 10);
    if (key) {
      if (!eventMap[key]) eventMap[key] = [];
      eventMap[key].push(e);
    }
  });

  const prevMonth = () => setMonth(new Date(year, monthNum - 1, 1));
  const nextMonth = () => setMonth(new Date(year, monthNum + 1, 1));

  const cells: (null | number)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-bold text-lg">
          {month.toLocaleDateString("en-KE", { month: "long", year: "numeric" })}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-xs font-semibold text-muted-foreground text-center py-2 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-l border-t rounded-lg overflow-hidden">
        {cells.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`blank-${i}`}
                className="border-r border-b min-h-[90px] bg-muted/20"
              />
            );
          }
          const dateStr = `${year}-${String(monthNum + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventMap[dateStr] ?? [];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`border-r border-b min-h-[90px] p-1.5 transition-colors ${
                dayEvents.length > 0 ? "bg-card hover:bg-muted/20" : "bg-card/50"
              }`}
            >
              <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 mx-auto flex-shrink-0 ${
                isToday
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e: any) => (
                  <Link key={e.id} href={`/events/${e.id}`}>
                    <div
                      className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity font-medium leading-tight ${
                        CAL_CHIP[e.status] ?? "bg-muted text-muted-foreground"
                      }`}
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-1.5">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2">
        {Object.entries(CAL_CHIP).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${cls}`} />
            <span className="text-xs text-muted-foreground capitalize">{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EventsList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError: eventsError } = useListMyEvents(
    statusFilter !== "all"
      ? { status: statusFilter as any, page: 1, limit: 50 }
      : { page: 1, limit: 50 }
  );

  const allEvents = data?.events ?? [];

  // Client-side text search across title, venue, city, eventType
  const events = search.trim()
    ? allEvents.filter(e => {
        const q = search.toLowerCase();
        return (
          (e.title ?? "").toLowerCase().includes(q) ||
          (e.venue ?? "").toLowerCase().includes(q) ||
          (e.city ?? "").toLowerCase().includes(q) ||
          (e.eventType ?? "").replace(/_/g, " ").toLowerCase().includes(q)
        );
      })
    : allEvents;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {eventsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to load events — please refresh the page.</span>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Events</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading
              ? "Loading…"
              : search.trim()
                ? `${events.length} result${events.length !== 1 ? "s" : ""} for "${search}"`
                : `${data?.total ?? 0} event${(data?.total ?? 0) !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 border rounded-lg p-1 bg-background">
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded transition-colors ${
                view === "list"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`p-1.5 rounded transition-colors ${
                view === "calendar"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Calendar view"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
          {events.length > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV(events)}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          <Link href="/events/new">
            <Button className="font-semibold shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-9 h-11"
          placeholder="Search events by name, venue, city or type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSearch("")}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status chip filters (list view only) */}
      {view === "list" && !search && (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            {CHIP_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  statusFilter === value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
        </div>
      )}

      {/* Calendar view */}
      {view === "calendar" && (
        isLoading ? (
          <Skeleton className="h-[500px] w-full rounded-xl" />
        ) : (
          <CalendarView events={events} />
        )
      )}

      {/* List view */}
      {view === "list" && (
        isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
          </div>
        ) : events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              {statusFilter !== "all" ? (
                <>
                  <h3 className="text-xl font-semibold mb-2">No {STATUS_LABELS[statusFilter]?.toLowerCase()} events</h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    Try a different filter to see other events.
                  </p>
                  <Button variant="outline" onClick={() => setStatusFilter("all")}>
                    Show all events
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    Create your first event brief and start receiving competitive quotes from Nairobi's best vendors within 4 hours.
                  </p>
                  <Link href="/events/new">
                    <Button size="lg" className="font-semibold">Create Your First Event</Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const badge = STATUS_BADGE[event.status] ?? { variant: "secondary" };
              const isDraft = event.status === "draft";
              const hasActionNeeded = event.status === "quotes_received";
              const daysUntilEvent = Math.ceil(
                (new Date(event.eventDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000
              );
              const isUrgent =
                daysUntilEvent >= 0 &&
                daysUntilEvent <= 7 &&
                !["booked", "completed", "cancelled", "vendor_selected"].includes(event.status);
              return (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-5 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all group ${
                    isUrgent
                      ? "border-red-300 bg-red-50/40 dark:bg-red-950/20"
                      : hasActionNeeded
                      ? "border-primary/30 bg-primary/5"
                      : ""
                  }`}
                >
                  <Link href={`/events/${event.id}`} className="flex items-start gap-4 flex-1 min-w-0 cursor-pointer">
                    <div className={`p-2.5 rounded-md hidden sm:flex items-center justify-center flex-shrink-0 ${isUrgent ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400" : "bg-primary/10 text-primary"}`}>
                      {isUrgent ? <AlertTriangle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {event.title}
                        </h3>
                        {isUrgent && (
                          <Badge className="bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50 text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {daysUntilEvent === 0 ? "Today" : `${daysUntilEvent}d away`} — no vendor
                          </Badge>
                        )}
                        {!isUrgent && hasActionNeeded && (
                          <Badge className="bg-primary text-primary-foreground text-xs animate-pulse">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <span className="capitalize">{event.eventType.replace(/_/g, " ")}</span>
                        <span className="text-border">·</span>
                        <span className="truncate">{event.venue ?? "Venue TBD"}, {event.city ?? "Nairobi"}</span>
                        <span className="text-border">·</span>
                        <span className="flex-shrink-0">{new Date(event.eventDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{event.guestCount} guests</span>
                        {event.budgetMax && (
                          <>
                            <span className="text-border">·</span>
                            <span>Budget up to KES {Number(event.budgetMax).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <Badge variant={badge.variant} className={badge.className}>
                      {STATUS_LABELS[event.status] ?? event.status}
                    </Badge>
                    {isDraft && (
                      <Link href={`/events/${event.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          onClick={e => e.stopPropagation()}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                    <Link href={`/events/${event.id}`}>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
