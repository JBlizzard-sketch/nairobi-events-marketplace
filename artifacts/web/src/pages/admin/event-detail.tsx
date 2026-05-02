import { useParams } from "wouter";
import { Link } from "wouter";
import { useAdminListEvents } from "@workspace/api-client-react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Calendar, MapPin, Users, Building2, FileText,
  Briefcase, AlertTriangle, DollarSign, Tag, Clock,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:           { label: "Draft",             className: "bg-muted text-muted-foreground" },
  brief_submitted: { label: "Brief Submitted",   className: "bg-blue-100 text-blue-800 border-blue-200" },
  quotes_requested:{ label: "Quotes Requested",  className: "bg-amber-100 text-amber-800 border-amber-200" },
  quotes_received: { label: "Quotes In",         className: "bg-primary/10 text-primary border-primary/20" },
  vendor_selected: { label: "Vendor Chosen",     className: "bg-violet-100 text-violet-800 border-violet-200" },
  booked:          { label: "Booked",            className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  completed:       { label: "Completed",         className: "bg-green-100 text-green-800 border-green-200" },
  cancelled:       { label: "Cancelled",         className: "bg-red-100 text-red-800 border-red-200" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function AdminEventDetail() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useAdminListEvents(
    { limit: 1000 },
    { query: { enabled: !!id } as any },
  );

  const events = useMemo(() => {
    const raw = data as any;
    return (Array.isArray(raw) ? raw : raw?.events ?? []) as any[];
  }, [data]);

  const ev = useMemo(() => events.find((e: any) => e.id === id), [events, id]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="font-semibold mb-2">Event not found.</p>
        <Link href="/admin/events">
          <Button variant="outline" size="sm" className="gap-2 mt-2">
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[ev.status] ?? { label: ev.status, className: "bg-muted text-muted-foreground" };
  const isPast = new Date(ev.eventDate) < new Date();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <Link href="/admin/events">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> All Events
          </button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ev.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={`text-xs ${statusCfg.className}`}>{statusCfg.label}</Badge>
              {ev.isEmergency && (
                <Badge className="bg-red-100 text-red-800 border-red-200 text-xs gap-1">
                  <AlertTriangle className="h-3 w-3" /> Emergency
                </Badge>
              )}
              {isPast && !["completed", "cancelled"].includes(ev.status) && (
                <Badge variant="outline" className="text-xs text-muted-foreground">Past Date</Badge>
              )}
              {ev.category && (
                <Badge variant="outline" className="text-xs capitalize">
                  {String(ev.category).replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats chips ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-sm border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-2xl font-black">{ev.quoteCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Quote Request{ev.quoteCount !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-2xl font-black text-emerald-700">{ev.bookingCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Booking{ev.bookingCount !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Event info ─────────────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Event Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <InfoRow icon={Calendar} label="Event Date" value={ev.eventDate ? formatDate(ev.eventDate) : null} />
          <InfoRow icon={MapPin}   label="City"        value={ev.city} />
          <InfoRow icon={MapPin}   label="Venue"       value={ev.venue} />
          <InfoRow icon={Users}    label="Guest Count" value={ev.guestCount ? `${ev.guestCount} expected` : null} />
          <InfoRow icon={Tag}      label="Category"    value={ev.category ? String(ev.category).replace(/_/g, " ") : null} />
          <InfoRow icon={DollarSign} label="Budget Range" value={
            ev.budgetMin || ev.budgetMax
              ? `KES ${Number(ev.budgetMin || 0).toLocaleString()} – KES ${Number(ev.budgetMax || 0).toLocaleString()}`
              : null
          } />
          {ev.description && (
            <div className="py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{ev.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Planner ────────────────────────────────────────────────────────── */}
      {(ev.plannerName || ev.plannerEmail) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Planner</CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <InfoRow icon={Building2} label="Name"  value={ev.plannerName} />
            <InfoRow icon={Building2} label="Email" value={ev.plannerEmail} />
          </CardContent>
        </Card>
      )}

      {/* ── Meta ───────────────────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Record Info</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          <InfoRow icon={Clock}    label="Created"    value={ev.createdAt ? formatDate(ev.createdAt) : null} />
          <InfoRow icon={Clock}    label="Updated"    value={ev.updatedAt ? formatDate(ev.updatedAt) : null} />
          <InfoRow icon={FileText} label="Event ID"   value={<code className="font-mono text-xs">{ev.id}</code>} />
        </CardContent>
      </Card>

      {/* ── Admin actions ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 pb-4">
        <Link href={`/admin/bookings?eventId=${ev.id}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Briefcase className="h-3.5 w-3.5" />
            View Bookings
          </Button>
        </Link>
        <Link href="/admin/events">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Events
          </Button>
        </Link>
      </div>
    </div>
  );
}
