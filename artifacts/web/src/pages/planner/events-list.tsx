import { useState } from "react";
import { Link } from "wouter";
import { useListMyEvents } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ChevronRight, Plus, FileText } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  brief_submitted: "Brief Submitted",
  quotes_requested: "Quotes Requested",
  quotes_received: "Quotes Received",
  vendor_selected: "Vendor Selected",
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled",
};

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

export default function EventsList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useListMyEvents(
    statusFilter !== "all" ? { status: statusFilter as any, page: 1, limit: 50 } : { page: 1, limit: 50 }
  );

  const events = data?.events ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
          <p className="text-muted-foreground mt-1">{data?.total ?? 0} events total</p>
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/events/new">
            <Button className="font-semibold shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

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
            <h3 className="text-xl font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              Create your first event brief and start receiving competitive quotes from Nairobi's best vendors within 4 hours.
            </p>
            <Link href="/events/new">
              <Button size="lg" className="font-semibold">Create Your First Event</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="flex items-center justify-between p-5 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-md hidden sm:flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="capitalize">{event.eventType.replace(/_/g, " ")}</span>
                      <span>·</span>
                      <span>{event.venue ?? "Venue TBD"}, {event.city ?? "Nairobi"}</span>
                      <span>·</span>
                      <span>{new Date(event.eventDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <span>{event.guestCount} guests</span>
                      {event.budgetMax && (
                        <>
                          <span>·</span>
                          <span>Budget up to KES {Number(event.budgetMax).toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                  <Badge variant={(STATUS_COLORS[event.status] ?? "secondary") as any}>
                    {STATUS_LABELS[event.status] ?? event.status}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
