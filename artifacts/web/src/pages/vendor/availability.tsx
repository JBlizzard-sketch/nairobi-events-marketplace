import { useState } from "react";
import { useGetVendorAvailability, useSetMyAvailability, useGetMyVendorProfile, getGetVendorAvailabilityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Save, CalendarRange, X, AlertTriangle } from "lucide-react";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function datesBetween(start: string, end: string): string[] {
  const result: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    result.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

export default function VendorAvailability() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Range dialog state
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeAction, setRangeAction] = useState<"block" | "unblock">("block");
  const [rangeError, setRangeError] = useState<string | null>(null);

  const { data: profile } = useGetMyVendorProfile();
  const vendorId = (profile as any)?.id ?? "";

  const fromDate = new Date(year, month, 1).toISOString().split("T")[0];
  const toDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const { data: availability, isLoading, refetch, isError: availError } = useGetVendorAvailability(
    vendorId,
    { from: fromDate, to: toDate },
    { query: { enabled: !!vendorId, queryKey: getGetVendorAvailabilityQueryKey(vendorId, { from: fromDate, to: toDate }) } }
  );

  const setAvail = useSetMyAvailability();

  const days = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const bookedDates = new Set(
    ((availability as any[]) ?? []).filter(a => !a.isAvailable).map(a => a.date)
  );

  const getDateStatus = (dateStr: string) => {
    if (dateStr in toggled) return toggled[dateStr];
    return !bookedDates.has(dateStr);
  };

  const toggleDate = (dateStr: string) => {
    if (new Date(dateStr) < new Date(today.toISOString().split("T")[0])) return;
    setToggled(prev => ({ ...prev, [dateStr]: !getDateStatus(dateStr) }));
  };

  const handleSave = async () => {
    if (!vendorId) return;
    setSaving(true);
    const dates = Object.entries(toggled).map(([date, isAvailable]) => ({ date, isAvailable }));
    if (dates.length > 0) {
      await setAvail.mutateAsync({ data: { dates } } as any);
      setToggled({});
      refetch();
    }
    setSaving(false);
  };

  const handleApplyRange = () => {
    setRangeError(null);
    if (!rangeStart || !rangeEnd) { setRangeError("Please select both start and end dates."); return; }
    if (rangeStart > rangeEnd) { setRangeError("Start date must be before end date."); return; }
    const todayStr = today.toISOString().split("T")[0];
    if (rangeEnd < todayStr) { setRangeError("Cannot block dates in the past."); return; }

    const dates = datesBetween(rangeStart, rangeEnd).filter(d => d >= todayStr);
    if (dates.length === 0) { setRangeError("No future dates in this range."); return; }
    if (dates.length > 365) { setRangeError("Range cannot exceed 365 days."); return; }

    const newToggled: Record<string, boolean> = { ...toggled };
    dates.forEach(d => { newToggled[d] = rangeAction !== "block"; });
    setToggled(newToggled);
    setRangeOpen(false);
    setRangeStart("");
    setRangeEnd("");
    setRangeError(null);
  };

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const changesCount = Object.keys(toggled).length;

  // Month summary stats
  const unavailableCount = Array.from({ length: days }, (_, i) => {
    const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    return !getDateStatus(d) ? 1 : 0;
  }).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {availError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to load availability data — please refresh the page.</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Availability Calendar</h1>
          <p className="text-muted-foreground mt-1">Mark dates when you are unavailable to take bookings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => { setRangeAction("block"); setRangeOpen(true); }}
            className="gap-2"
          >
            <CalendarRange className="h-4 w-4" />
            Block Range
          </Button>
          {changesCount > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setToggled({})}
                className="gap-1.5 text-muted-foreground"
              >
                <X className="h-4 w-4" /> Reset ({changesCount})
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2 font-semibold">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : `Save ${changesCount} change${changesCount !== 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Legend + month summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-sm bg-background border border-border" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 rounded-sm bg-destructive/20 border border-destructive/40" />
            <span className="text-muted-foreground">Unavailable</span>
          </div>
          {changesCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 rounded-sm border-2 border-amber-400" />
              <span className="text-muted-foreground">Unsaved change</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="text-xs">
            {unavailableCount} day{unavailableCount !== 1 ? "s" : ""} blocked this month
          </Badge>
          <Badge variant="outline" className="text-xs bg-muted/30">
            {days - unavailableCount} available
          </Badge>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-xl">{MONTH_NAMES[month]} {year}</CardTitle>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div>
              <div className="grid grid-cols-7 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: days }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isPast = new Date(dateStr) < new Date(today.toISOString().split("T")[0]);
                  const isAvailable = getDateStatus(dateStr);
                  const isToday = dateStr === today.toISOString().split("T")[0];
                  const hasChange = dateStr in toggled;

                  return (
                    <button
                      key={day}
                      onClick={() => toggleDate(dateStr)}
                      disabled={isPast}
                      className={cn(
                        "aspect-square rounded-md flex items-center justify-center text-sm font-medium transition-all",
                        isPast ? "text-muted-foreground/30 cursor-not-allowed" :
                        !isAvailable ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25" :
                        "hover:bg-muted/50 text-foreground",
                        isToday && "ring-2 ring-primary ring-offset-1",
                        hasChange && "ring-2 ring-amber-400 ring-offset-1"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick tips */}
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Tips</p>
        <p>• Click individual days to toggle availability. Your changes are highlighted in amber until saved.</p>
        <p>• Use <span className="font-medium text-foreground">Block Range</span> to quickly block multiple consecutive days — great for holidays or venue closures.</p>
        <p>• Blocked dates are visible to planners and will prevent quote requests for those dates.</p>
      </div>

      {/* Block range dialog */}
      <Dialog open={rangeOpen} onOpenChange={open => { if (!open) { setRangeOpen(false); setRangeError(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-primary" />
              {rangeAction === "block" ? "Block Date Range" : "Unblock Date Range"}
            </DialogTitle>
            <DialogDescription>
              All dates between the start and end (inclusive) will be marked as{" "}
              <strong>{rangeAction === "block" ? "unavailable" : "available"}</strong>. Past dates are skipped automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">Start Date</Label>
                <Input
                  type="date"
                  value={rangeStart}
                  min={today.toISOString().split("T")[0]}
                  onChange={e => setRangeStart(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">End Date</Label>
                <Input
                  type="date"
                  value={rangeEnd}
                  min={rangeStart || today.toISOString().split("T")[0]}
                  onChange={e => setRangeEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={rangeAction === "block" ? "default" : "outline"}
                size="sm"
                onClick={() => setRangeAction("block")}
                className="flex-1"
              >
                Block dates
              </Button>
              <Button
                variant={rangeAction === "unblock" ? "default" : "outline"}
                size="sm"
                onClick={() => setRangeAction("unblock")}
                className="flex-1"
              >
                Unblock dates
              </Button>
            </div>

            {rangeError && (
              <p className="text-sm text-destructive">{rangeError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setRangeOpen(false); setRangeError(null); }}>Cancel</Button>
            <Button onClick={handleApplyRange} className="gap-2">
              <CalendarRange className="h-4 w-4" />
              Apply Range
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
