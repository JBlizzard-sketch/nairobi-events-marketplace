import { useState } from "react";
import { Link } from "wouter";
import { useListMyEvents } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight, Plus, FileText, Pencil } from "lucide-react";

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
  quotes_requested: { variant: "outline", className: "border-amber-300 text-amber-700 bg-amber-50" },
  quotes_received: { variant: "default", className: "bg-primary text-primary-foreground" },
  vendor_selected: { variant: "secondary" },
  booked: { variant: "secondary", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  completed: { variant: "secondary" },
  cancelled: { variant: "destructive" },
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

export default function EventsList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useListMyEvents(
    statusFilter !== "all"
      ? { status: statusFilter as any, page: 1, limit: 50 }
      : { page: 1, limit: 50 }
  );

  const events = data?.events ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Loading…" : `${data?.total ?? 0} event${(data?.total ?? 0) !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <Link href="/events/new">
          <Button className="font-semibold shadow-sm gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </Link>
      </div>

      {/* Status chip filters */}
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

      {/* List */}
      {isLoading ? (
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
            return (
              <div key={event.id} className="flex items-center justify-between p-5 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all group">
                <Link href={`/events/${event.id}`} className="flex items-start gap-4 flex-1 min-w-0 cursor-pointer">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-md hidden sm:flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span className="capitalize">{event.eventType.replace(/_/g, " ")}</span>
                      <span className="text-border">·</span>
                      <span className="truncate">{event.venue ?? "Venue TBD"}, {event.city ?? "Nairobi"}</span>
                      <span className="text-border">·</span>
                      <span className="flex-shrink-0">{new Date(event.eventDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
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
      )}
    </div>
  );
}
