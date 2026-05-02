import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateEvent, useSubmitEventBrief } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from "lucide-react";

const EVENT_TYPES = ["corporate", "wedding", "birthday", "product_launch", "conference", "private_party", "other"];
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

const STEPS = [
  { label: "Event Type", desc: "What are you planning?" },
  { label: "Date & Venue", desc: "When and where?" },
  { label: "Budget & Scale", desc: "Numbers and resources" },
  { label: "Services Needed", desc: "What vendors do you need?" },
  { label: "Review & Submit", desc: "Confirm and send briefs" },
];

export default function EventNew() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({
    title: "",
    eventType: "corporate" as string,
    eventDate: "",
    venue: "",
    city: "Nairobi",
    guestCount: 50,
    budgetMin: "",
    budgetMax: "",
    currency: "KES",
    servicesNeeded: [] as string[],
    isEmergency: false,
  });

  const createEvent = useCreateEvent();
  const submitBrief = useSubmitEventBrief();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleService = (id: string) => {
    set("servicesNeeded", form.servicesNeeded.includes(id)
      ? form.servicesNeeded.filter(s => s !== id)
      : [...form.servicesNeeded, id]);
  };

  const canNext = () => {
    if (step === 0) return form.title.trim() && form.eventType;
    if (step === 1) return form.eventDate && form.venue.trim();
    if (step === 2) return form.guestCount > 0;
    if (step === 3) return form.servicesNeeded.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let id = createdId;
      if (!id) {
        const event = await createEvent.mutateAsync({
          data: {
            title: form.title,
            eventType: form.eventType as any,
            eventDate: form.eventDate,
            venue: form.venue,
            city: form.city,
            guestCount: form.guestCount,
            budgetMin: form.budgetMin ? String(form.budgetMin) : undefined,
            budgetMax: form.budgetMax ? String(form.budgetMax) : undefined,
            currency: "KES",
            servicesNeeded: form.servicesNeeded,
            isEmergency: form.isEmergency,
          },
        });
        id = (event as any).id;
        setCreatedId(id);
      }
      if (id) {
        await submitBrief.mutateAsync({ eventId: id });
        setLocation(`/events/${id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Event Brief</h1>
        <p className="text-muted-foreground mt-1">Fill in the details and receive quotes within 4 hours.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0 transition-all ${
              i < step ? "bg-primary text-primary-foreground" :
              i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
              "bg-muted text-muted-foreground"
            }`}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/50">
          <CardTitle>{STEPS[step].label}</CardTitle>
          <CardDescription>{STEPS[step].desc}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input
                  placeholder="e.g. Safaricom Q2 Offsite, Sarah's Wedding"
                  value={form.title}
                  onChange={e => set("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={form.eventType} onValueChange={v => set("eventType", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Checkbox
                  id="emergency"
                  checked={form.isEmergency}
                  onCheckedChange={v => set("isEmergency", !!v)}
                />
                <Label htmlFor="emergency" className="cursor-pointer text-amber-900">
                  Emergency booking — I need vendors within 24 hours
                </Label>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={e => set("eventDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label>Venue Name</Label>
                <Input
                  placeholder="e.g. Kenyatta International Convention Centre"
                  value={form.venue}
                  onChange={e => set("venue", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Select value={form.city} onValueChange={v => set("city", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Expected Guests</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.guestCount}
                  onChange={e => set("guestCount", parseInt(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Budget (KES)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 200000"
                    value={form.budgetMin}
                    onChange={e => set("budgetMin", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Budget (KES)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 800000"
                    value={form.budgetMax}
                    onChange={e => set("budgetMax", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <Label className="mb-3 block">Select all services you need</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SERVICES.map(({ id, label }) => {
                  const selected = form.servicesNeeded.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleService(id)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all text-left ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {form.servicesNeeded.length > 0 && (
                <p className="text-sm text-muted-foreground pt-2">
                  {form.servicesNeeded.length} service{form.servicesNeeded.length > 1 ? "s" : ""} selected — we'll send briefs to 3 vendors per category
                </p>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="rounded-lg bg-muted/40 p-5 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-y-3">
                  <span className="text-muted-foreground">Event</span>
                  <span className="font-medium">{form.title}</span>
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{form.eventType.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{new Date(form.eventDate).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                  <span className="text-muted-foreground">Venue</span>
                  <span className="font-medium">{form.venue}, {form.city}</span>
                  <span className="text-muted-foreground">Guests</span>
                  <span className="font-medium">{form.guestCount}</span>
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">KES {Number(form.budgetMin || 0).toLocaleString()} – {Number(form.budgetMax || 0).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {form.servicesNeeded.map(s => (
                    <Badge key={s} variant="secondary" className="capitalize">{s.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-sm text-primary font-medium">
                We'll send your brief to up to {form.servicesNeeded.length * 3} vendors and you'll receive quotes within 4 hours.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step === 0 ? setLocation("/events") : setStep(s => s - 1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="gap-2 font-semibold">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2 font-semibold">
            <Send className="h-4 w-4" />
            {submitting ? "Sending Briefs..." : "Submit Brief"}
          </Button>
        )}
      </div>
    </div>
  );
}
