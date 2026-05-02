import { useState } from "react";
import { useAdminListEvents } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Calendar, Users, MapPin, ChevronRight, Search,
  AlertTriangle, FileText, Briefcase,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  brief_submitted: { label: "Brief Sent", className: "bg-blue-100 text-blue-800 border-blue-200" },
  quotes_requested: { label: "Quotes Requested", className: "bg-amber-100 text-amber-800 border-amber-200" },
  quotes_received: { label: "Quotes In", className: "bg-primary/10 text-primary border-primary/20" },
  vendor_selected: { label: "Vendor Chosen", className: "bg-violet-100 text-violet-800 border-violet-200" },
  booked: { label: "Booked", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" },
};

const STATUS_OPTIONS = [
  "draft", "brief_submitted", "quotes_requested", "quotes_received",
  "vendor_selected", "booked", "completed", "cancelled",
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminEvents() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminListEvents({
    status: statusFilter !== "all" ? statusFilter : undefined,
    page: 1,
    limit: 100,
  });

  const events = (data?.events ?? []) as any[];

  const filtered = search.trim()
    ? events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.plannerName?.toLowerCase().includes(search.toLowerCase()) ||
        e.city?.toLowerCase().includes(search.toLowerCase())
      )
    : events;

  const totalByStatus = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = events.filter(e => e.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Events</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading ? "Loading..." : `${data?.total ?? 0} events on the platform`}
        </p>
      </div>

      {/* Status summary chips */}
      {!isLoading && events.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.filter(s => totalByStatus[s] > 0).map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${cfg.className} ${
                  statusFilter === s ? "ring-2 ring-offset-1 ring-primary/40 shadow-sm" : "opacity-80 hover:opacity-100"
                }`}
              >
                {cfg.label} · {totalByStatus[s]}
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title, planner, or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Event list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold mb-1">No events found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev: any) => {
            const statusCfg = STATUS_CONFIG[ev.status] ?? { label: ev.status, className: "bg-muted text-muted-foreground" };
            const isEmergency = ev.isEmergency;
            const isPast = new Date(ev.eventDate) < new Date();

            return (
              <Card
                key={ev.id}
                className={`shadow-sm transition-all hover:shadow-md ${isEmergency ? "border-red-200" : ""}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 p-2.5 rounded-lg ${isEmergency ? "bg-red-50" : "bg-muted/50"}`}>
                      <FileText className={`h-5 w-5 ${isEmergency ? "text-red-500" : "text-muted-foreground"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-semibold text-foreground">{ev.title}</h3>
                        {isEmergency && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" /> Emergency
                          </Badge>
                        )}
                        <Badge className={`text-xs ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                        {isPast && !["completed", "cancelled"].includes(ev.status) && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Past Date
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(ev.eventDate)}
                        </span>
                        {ev.city && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {ev.city}{ev.venue ? `, ${ev.venue}` : ""}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {ev.guestCount} guests
                        </span>
                        {ev.budgetMax && (
                          <span className="capitalize text-xs">
                            Budget: KES {Number(ev.budgetMax).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {ev.plannerName && (
                          <span>Planner: <span className="font-medium text-foreground">{ev.plannerName}</span></span>
                        )}
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {ev.quoteCount} quote request{ev.quoteCount !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {ev.bookingCount} booking{ev.bookingCount !== 1 ? "s" : ""}
                        </span>
                        <span className="text-muted-foreground/60">
                          Created {formatDate(ev.createdAt)}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
