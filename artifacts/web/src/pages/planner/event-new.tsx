import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateEvent, useSubmitEventBrief, useBudgetOptimize } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, Send, Sparkles, Loader2, ChevronDown, ChevronUp, BookTemplate, Trash2 } from "lucide-react";
import type { BudgetOptimizeResult } from "@workspace/api-client-react";
import { useEventTemplates } from "@/hooks/use-event-templates";
import { useDocumentTitle } from "@/hooks/use-document-title";

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
  useDocumentTitle("Create Event");
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const { templates: eventTemplates, saveTemplate: saveEventTemplate, removeTemplate: removeEventTemplate } = useEventTemplates();
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Pre-select a service category from URL params (e.g. ?service=catering)
  const preselectedService = (() => {
    try {
      const s = new URLSearchParams(window.location.search).get("service") ?? "";
      return SERVICES.find(svc => svc.id === s) ? s : "";
    } catch {
      return "";
    }
  })();

  // Check for a duplicated event brief stored in localStorage
  const duplicatePrefill = (() => {
    try {
      const raw = localStorage.getItem("nairobi_event_prefill");
      if (raw) {
        localStorage.removeItem("nairobi_event_prefill");
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  })();

  const [form, setForm] = useState({
    title: duplicatePrefill?.title ?? "",
    eventType: (duplicatePrefill?.eventType ?? "corporate") as string,
    eventDate: "",
    venue: duplicatePrefill?.venue ?? "",
    city: duplicatePrefill?.city ?? "Nairobi",
    guestCount: duplicatePrefill?.guestCount ?? 50,
    budgetMin: duplicatePrefill?.budgetMin ?? "",
    budgetMax: duplicatePrefill?.budgetMax ?? "",
    currency: "KES",
    servicesNeeded: (duplicatePrefill?.servicesNeeded as string[] | undefined) ?? (preselectedService ? [preselectedService] : [] as string[]),
    isEmergency: false,
  });

  const createEvent = useCreateEvent();
  const submitBrief = useSubmitEventBrief();
  const budgetOptimize = useBudgetOptimize();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<BudgetOptimizeResult | null>(null);
  const [aiExpanded, setAiExpanded] = useState(false);

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleService = (id: string) => {
    set("servicesNeeded", form.servicesNeeded.includes(id)
      ? form.servicesNeeded.filter(s => s !== id)
      : [...form.servicesNeeded, id]);
    setAiResult(null);
  };

  const applyEventTemplate = (tpl: (typeof eventTemplates)[0]) => {
    setForm(prev => ({
      ...prev,
      ...tpl.form,
      eventDate: prev.eventDate,
    }));
    setShowTemplatePicker(false);
  };

  const handleSaveEventTemplate = () => {
    if (!templateName.trim()) return;
    saveEventTemplate(templateName.trim(), {
      title: form.title,
      eventType: form.eventType,
      venue: form.venue,
      city: form.city,
      guestCount: form.guestCount,
      budgetMin: form.budgetMin,
      budgetMax: form.budgetMax,
      currency: form.currency,
      servicesNeeded: form.servicesNeeded,
      isEmergency: form.isEmergency,
    });
    setTemplateName("");
    setShowTemplateSave(false);
  };

  const canNext = () => {
    if (step === 0) return form.title.trim() && form.eventType;
    if (step === 1) return form.eventDate && form.venue.trim();
    if (step === 2) return form.guestCount > 0;
    if (step === 3) return form.servicesNeeded.length > 0;
    return true;
  };

  const handleAiOptimize = async () => {
    setAiResult(null);
    setAiExpanded(true);
    const result = await budgetOptimize.mutateAsync({
      data: {
        eventType: form.eventType,
        guestCount: form.guestCount,
        totalBudget: form.budgetMax || form.budgetMin || undefined,
        servicesNeeded: form.servicesNeeded,
        city: form.city,
      },
    });
    setAiResult(result as BudgetOptimizeResult);
  };

  const applyAiSuggestion = () => {
    if (!aiResult) return;
    set("budgetMin", aiResult.suggestedMin);
    set("budgetMax", aiResult.suggestedMax);
    setStep(2);
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">New Event Brief</h1>
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{STEPS[step].label}</CardTitle>
              <CardDescription>{STEPS[step].desc}</CardDescription>
            </div>
            {step === 0 && eventTemplates.length > 0 && (
              <button
                onClick={() => setShowTemplatePicker(v => !v)}
                className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 px-2.5 py-1.5 rounded-md hover:bg-primary/10 transition-colors shrink-0 mt-0.5"
              >
                <BookTemplate className="h-3.5 w-3.5" />
                Load template
              </button>
            )}
          </div>
        </CardHeader>
        {step === 0 && showTemplatePicker && eventTemplates.length > 0 && (
          <div className="border-b border-border/50 px-6 py-3 bg-primary/5 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Pick a template to pre-fill the form:</p>
            <div className="flex flex-wrap gap-2">
              {eventTemplates.map(tpl => (
                <div key={tpl.id} className="flex items-center gap-0.5">
                  <button
                    onClick={() => applyEventTemplate(tpl)}
                    className="text-sm px-3 py-1.5 rounded-l-md border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 transition-colors"
                  >
                    {tpl.name}
                  </button>
                  <button
                    onClick={() => removeEventTemplate(tpl.id)}
                    className="px-1.5 py-1.5 rounded-r-md border border-l-0 border-primary/30 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                <Checkbox
                  id="emergency"
                  checked={form.isEmergency}
                  onCheckedChange={v => set("isEmergency", !!v)}
                />
                <Label htmlFor="emergency" className="cursor-pointer text-amber-900 dark:text-amber-300">
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
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => set("eventDate", e.target.value)}
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
                  inputMode="numeric"
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
                    inputMode="numeric"
                    min="0"
                    placeholder="e.g. 200000"
                    value={form.budgetMin}
                    onChange={e => set("budgetMin", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Budget (KES)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="e.g. 800000"
                    value={form.budgetMax}
                    onChange={e => set("budgetMax", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Not sure about your budget? Select your services on the next step, then use the AI advisor to get a market-rate estimate.
              </p>
            </>
          )}

          {step === 3 && (
            <div className="space-y-5">
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

              {/* AI Budget Advisor */}
              {form.servicesNeeded.length > 0 && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-950/20 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200/60 dark:border-amber-800/40">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-900 dark:text-amber-300">AI Budget Advisor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {aiResult && (
                        <button
                          type="button"
                          onClick={() => setAiExpanded(v => !v)}
                          className="text-amber-700 hover:text-amber-900 transition-colors"
                        >
                          {aiExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAiOptimize}
                        disabled={budgetOptimize.isPending}
                        className="border-amber-300 bg-white dark:bg-card text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-400 text-xs h-7 gap-1.5"
                      >
                        {budgetOptimize.isPending ? (
                          <><Loader2 className="h-3 w-3 animate-spin" /> Analysing…</>
                        ) : (
                          <><Sparkles className="h-3 w-3" /> {aiResult ? "Re-run" : "Get Estimate"}</>
                        )}
                      </Button>
                    </div>
                  </div>

                  {budgetOptimize.isPending && (
                    <div className="px-4 py-6 flex flex-col items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p className="text-sm">Analysing {form.servicesNeeded.length} services for {form.guestCount} guests in {form.city}…</p>
                    </div>
                  )}

                  {aiResult && aiExpanded && (
                    <div className="px-4 py-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider font-medium">Suggested Total Budget</p>
                          <p className="text-lg font-bold text-amber-900 dark:text-amber-300">
                            KES {Number(aiResult.suggestedMin).toLocaleString()} – {Number(aiResult.suggestedMax).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={applyAiSuggestion}
                          className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Apply to Budget
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {aiResult.breakdown.map(item => (
                          <div key={item.service} className="flex items-start gap-3 bg-white/70 dark:bg-amber-950/20 rounded-lg px-3 py-2.5 border border-amber-100 dark:border-amber-800/40">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-gray-800 dark:text-amber-200">{item.label}</span>
                                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 whitespace-nowrap">
                                  KES {Number(item.amount).toLocaleString()}
                                </span>
                              </div>
                              <div className="mt-1.5 h-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-amber-500"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1.5">{item.rationale}</p>
                            </div>
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium shrink-0 pt-0.5">{item.percentage}%</span>
                          </div>
                        ))}
                      </div>

                      {aiResult.tips.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Cost-saving tips</p>
                          <ul className="space-y-1">
                            {aiResult.tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-300">
                                <span className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {!aiResult && !budgetOptimize.isPending && (
                    <div className="px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                      Get Nairobi market-rate estimates for your {form.servicesNeeded.length} selected service{form.servicesNeeded.length > 1 ? "s" : ""} based on {form.guestCount} guests.
                    </div>
                  )}
                </div>
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

              {/* Save as template */}
              {!showTemplateSave ? (
                <button
                  onClick={() => { setShowTemplateSave(true); setTemplateName(""); }}
                  className="w-full text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg hover:border-primary/40 transition-colors"
                >
                  <BookTemplate className="h-3.5 w-3.5" />
                  Save this setup as a reusable event template
                </button>
              ) : (
                <div className="flex gap-2 items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                  <BookTemplate className="h-4 w-4 text-primary shrink-0" />
                  <Input
                    placeholder='Template name (e.g. "Monthly Team Lunch")'
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="h-8 text-sm flex-1"
                    onKeyDown={e => e.key === "Enter" && handleSaveEventTemplate()}
                  />
                  <Button size="sm" className="h-8 px-3 text-xs" onClick={handleSaveEventTemplate} disabled={!templateName.trim()}>
                    Save
                  </Button>
                  <button type="button" onClick={() => setShowTemplateSave(false)} className="text-muted-foreground hover:text-foreground">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

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
