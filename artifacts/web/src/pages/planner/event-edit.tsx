import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useGetEvent, useUpdateEvent } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useDocumentTitle } from "@/hooks/use-document-title";

const SERVICES = [
  { id: "catering", label: "Catering" },
  { id: "mc", label: "MC / Emcee" },
  { id: "photography", label: "Photography" },
  { id: "videography", label: "Videography" },
  { id: "floristry", label: "Floristry" },
  { id: "av_technical", label: "AV & Technical" },
  { id: "tent_furniture", label: "Tent & Furniture" },
  { id: "security", label: "Security" },
  { id: "entertainment", label: "Entertainment" },
  { id: "decor", label: "Decor" },
  { id: "transportation", label: "Transportation" },
];

const EVENT_TYPES = ["corporate", "wedding", "birthday", "product_launch", "conference", "private_party", "other"];

function toDateInput(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { data: event, isLoading, isError: eventError } = useGetEvent(id!);
  const update = useUpdateEvent();

  const e = event as any;
  useDocumentTitle(e?.title ? `Edit — ${e.title}` : "Edit Event");

  const [form, setForm] = useState({
    title: "",
    eventType: "corporate",
    eventDate: "",
    venue: "",
    city: "Nairobi",
    guestCount: 100,
    budgetMin: "",
    budgetMax: "",
    servicesNeeded: [] as string[],
    specialRequirements: "",
  });

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (e) {
      setForm({
        title: e.title ?? "",
        eventType: e.eventType ?? "corporate",
        eventDate: toDateInput(e.eventDate),
        venue: e.venue ?? "",
        city: e.city ?? "Nairobi",
        guestCount: e.guestCount ?? 100,
        budgetMin: e.budgetMin?.toString() ?? "",
        budgetMax: e.budgetMax?.toString() ?? "",
        servicesNeeded: e.servicesNeeded ?? [],
        specialRequirements: e.specialRequirements ?? "",
      });
    }
  }, [event]);

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleService = (svc: string) => {
    set("servicesNeeded", form.servicesNeeded.includes(svc)
      ? form.servicesNeeded.filter(s => s !== svc)
      : [...form.servicesNeeded, svc]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await update.mutateAsync({
        eventId: id!,
        data: {
          title: form.title,
          eventDate: form.eventDate,
          venue: form.venue,
          guestCount: Number(form.guestCount),
          budgetMin: form.budgetMin,
          budgetMax: form.budgetMax,
          servicesNeeded: form.servicesNeeded,
          specialRequirements: form.specialRequirements,
        } as any,
      });
      setSaved(true);
      setTimeout(() => {
        setLocation(`/events/${id}`);
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isEditable = e && e.status === "draft";

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (eventError || !e) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{eventError ? "Failed to load event — please refresh the page." : "Event not found."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isEditable) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to Event
          </Button>
        </Link>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This event brief has already been submitted and can no longer be edited. Only draft events can be updated.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Event
          </Button>
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Event Brief</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Update your event details before submitting to vendors.
            </p>
          </div>
          <Badge variant="outline" className="text-xs capitalize mt-1 flex-shrink-0">Draft</Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-300">Saved! Redirecting back to your event…</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Event Details</CardTitle>
          <CardDescription>Basic information about your event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="e.g. Annual Company Gala 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={form.eventType} onValueChange={v => set("eventType", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Event Date</Label>
              <Input
                type="date"
                value={form.eventDate}
                onChange={e => set("eventDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Venue / Location</Label>
              <Input
                value={form.venue}
                onChange={e => set("venue", e.target.value)}
                placeholder="e.g. KICC, Nairobi"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={e => set("city", e.target.value)}
                placeholder="e.g. Nairobi"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expected Guests</Label>
            <Input
              type="number"
              min={1}
              value={form.guestCount}
              onChange={e => set("guestCount", Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Budget</CardTitle>
          <CardDescription>Your total budget range in KES</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum (KES)</Label>
              <Input
                type="number"
                min={0}
                value={form.budgetMin}
                onChange={e => set("budgetMin", e.target.value)}
                placeholder="e.g. 500000"
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum (KES)</Label>
              <Input
                type="number"
                min={0}
                value={form.budgetMax}
                onChange={e => set("budgetMax", e.target.value)}
                placeholder="e.g. 1000000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Services Needed</CardTitle>
          <CardDescription>Select the vendor categories you need quotes for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SERVICES.map(({ id: svcId, label }) => (
              <label
                key={svcId}
                className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  form.servicesNeeded.includes(svcId)
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <Checkbox
                  checked={form.servicesNeeded.includes(svcId)}
                  onCheckedChange={() => toggleService(svcId)}
                  className="flex-shrink-0"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Special Requirements</CardTitle>
          <CardDescription>Any extra details vendors should know</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.specialRequirements}
            onChange={e => set("specialRequirements", e.target.value)}
            placeholder="e.g. Outdoor venue, dietary restrictions, theme, setup time requirements..."
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pb-8">
        <Link href={`/events/${id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          onClick={handleSave}
          disabled={saving || saved || !form.title.trim() || !form.eventDate}
          className="gap-2 min-w-28"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle2 className="h-4 w-4" /> Saved!</>
          ) : (
            <><Save className="h-4 w-4" /> Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
}
