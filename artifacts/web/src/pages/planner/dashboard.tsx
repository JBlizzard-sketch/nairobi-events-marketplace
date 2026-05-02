import { useAuth } from "@/hooks/use-auth";
import { useListMyEvents, useListMyQuoteRequests, useListMyBookings } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronRight, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlannerDashboard() {
  const { data: events, isLoading: loadingEvents } = useListMyEvents({ limit: 5 });
  const { data: bookings, isLoading: loadingBookings } = useListMyBookings({});
  
  // Pending quotes could be derived from events or quotes requested
  
  const activeEvents = events?.events.filter(e => e.status !== "completed" && e.status !== "cancelled") || [];
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here is what's happening with your events.</p>
        </div>
        <Link href="/events/new">
          <Button className="font-semibold shadow-sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Create New Event
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Active Events</CardDescription>
            <CardTitle className="text-4xl text-primary">{loadingEvents ? <Skeleton className="h-10 w-16" /> : activeEvents.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Currently in planning</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Pending Quotes</CardDescription>
            <CardTitle className="text-4xl text-foreground">{loadingEvents ? <Skeleton className="h-10 w-16" /> : "0"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Awaiting your review</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Confirmed Bookings</CardDescription>
            <CardTitle className="text-4xl text-foreground">{loadingBookings ? <Skeleton className="h-10 w-16" /> : bookings?.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Ready to go</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Your latest event briefs and planning status</CardDescription>
            </div>
            <Link href="/events">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
              </div>
            ) : events?.events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20 border-dashed">
                <div className="bg-primary/10 p-3 rounded-full mb-4">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No events yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mb-4">Create your first event brief to start receiving quotes from Nairobi's best vendors within 4 hours.</p>
                <Link href="/events/new">
                  <Button variant="outline">Create Event</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {events?.events.slice(0, 5).map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer hover:bg-muted/30 group">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary/10 text-primary p-2 rounded-md hidden sm:block">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{event.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {new Date(event.eventDate).toLocaleDateString()}</span>
                            <span className="capitalize">{event.eventType.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="capitalize">
                          {event.status.replace('_', ' ')}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Actions needing your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                <div className="bg-muted p-3 rounded-full mb-4">
                  <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">You're all caught up</h3>
                <p className="text-muted-foreground text-sm mt-1">No pending actions right now.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
