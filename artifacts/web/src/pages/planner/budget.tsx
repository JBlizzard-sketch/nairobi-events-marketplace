import { useState } from "react";
import { useBudgetOptimize } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Lightbulb, RefreshCw, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const EVENT_TYPES = [
  { value: "corporate_conference", label: "Corporate Conference" },
  { value: "team_building", label: "Team Building" },
  { value: "product_launch", label: "Product Launch" },
  { value: "gala_dinner", label: "Gala Dinner" },
  { value: "wedding", label: "Wedding" },
  { value: "birthday", label: "Birthday Party" },
  { value: "graduation", label: "Graduation" },
  { value: "workshop", label: "Workshop / Seminar" },
  { value: "other", label: "Other" },
];

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

const CITIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];

const SERVICE_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-teal-500",
  "bg-indigo-500", "bg-fuchsia-500", "bg-lime-500",
];

function formatKES(amount: string | number) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}

export default function BudgetOptimizer() {
  const [eventType, setEventType] = useState("corporate_conference");
  const [guestCount, setGuestCount] = useState("100");
  const [city, setCity] = useState("Nairobi");
  const [budget, setBudget] = useState("");
  const [services, setServices] = useState<string[]>(["catering", "photography", "av_technical"]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const optimize = useBudgetOptimize();

  const toggleService = (id: string) => {
    setServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  };

  const handleOptimize = async () => {
    if (services.length === 0) { setError("Please select at least one service."); return; }
    if (!guestCount || Number(guestCount) < 1) { setError("Please enter a valid guest count."); return; }
    setError(null);
    setResult(null);
    try {
      const res = await optimize.mutateAsync({
        data: {
          eventType,
          guestCount: Number(guestCount),
          city,
          totalBudget: budget ? String(budget) : undefined,
          servicesNeeded: services,
        } as any,
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "AI optimization failed. Please try again.");
    }
  };

  const breakdown: any[] = result?.breakdown ?? [];
  const maxAmount = Math.max(...breakdown.map((b: any) => Number(b.amount)), 1);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AI Budget Optimizer</h1>
        </div>
        <p className="text-muted-foreground">
          Get AI-powered budget recommendations based on real Nairobi vendor pricing. Tell us about your event and we'll suggest realistic allocations across your chosen services.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Help the AI understand your event so it can give accurate estimates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City / Location</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expected Guest Count</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 150"
                value={guestCount}
                onChange={e => setGuestCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Total Budget (KES)
                <span className="ml-2 text-xs text-muted-foreground font-normal">optional</span>
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="Leave blank for AI suggestion"
                value={budget}
                onChange={e => setBudget(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Services Needed</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICES.map(s => (
                <label
                  key={s.id}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all text-sm font-medium ${
                    services.includes(s.id)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <Checkbox
                    checked={services.includes(s.id)}
                    onCheckedChange={() => toggleService(s.id)}
                    className="h-3.5 w-3.5"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button
            size="lg"
            className="w-full font-semibold gap-2"
            onClick={handleOptimize}
            disabled={optimize.isPending}
          >
            {optimize.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analysing Nairobi market rates...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Optimise My Budget
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="shadow-sm border-primary/30 bg-primary/5">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Suggested Budget Range</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatKES(result.suggestedMin)} – {formatKES(result.suggestedMax)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Number(guestCount)} guests · {EVENT_TYPES.find(t => t.value === eventType)?.label} · {city}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Services Covered</p>
                <div className="flex flex-wrap gap-1.5">
                  {services.map(s => (
                    <Badge key={s} variant="secondary" className="capitalize text-xs">
                      {SERVICES.find(sv => sv.id === s)?.label ?? s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Budget Breakdown</CardTitle>
              <CardDescription>AI-recommended allocations based on current Nairobi market rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {breakdown.map((item: any, i: number) => {
                const pct = Math.round((Number(item.amount) / maxAmount) * 100);
                const color = SERVICE_COLORS[i % SERVICE_COLORS.length];
                return (
                  <div key={item.service} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                        <span className="font-medium">{item.label}</span>
                        <Badge variant="outline" className="text-xs">{item.percentage}%</Badge>
                      </div>
                      <span className="font-bold">{formatKES(item.amount)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {item.rationale && (
                      <p className="text-xs text-muted-foreground pl-4 leading-relaxed">{item.rationale}</p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {result.tips && result.tips.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <CardTitle>Cost-Saving Tips</CardTitle>
                </div>
                <CardDescription>AI-generated tips specific to your event type and size</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.tips.map((tip: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/events/new" className="flex-1">
              <Button className="w-full font-semibold gap-2">
                Use This Budget for a New Event
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => { setResult(null); }}
              className="sm:w-auto"
            >
              Optimise Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
