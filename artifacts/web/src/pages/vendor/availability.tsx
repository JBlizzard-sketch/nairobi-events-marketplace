import { useState } from "react";
import { useGetVendorAvailability, useSetMyAvailability, useGetMyVendorProfile, getGetVendorAvailabilityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export default function VendorAvailability() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const { data: profile } = useGetMyVendorProfile();
  const vendorId = (profile as any)?.id ?? "";

  const fromDate = new Date(year, month, 1).toISOString().split("T")[0];
  const toDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const { data: availability, isLoading, refetch } = useGetVendorAvailability(
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

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const changesCount = Object.keys(toggled).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability Calendar</h1>
          <p className="text-muted-foreground mt-1">Mark dates when you are unavailable to take bookings</p>
        </div>
        {changesCount > 0 && (
          <Button onClick={handleSave} disabled={saving} className="gap-2 font-semibold">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : `Save ${changesCount} change${changesCount !== 1 ? "s" : ""}`}
          </Button>
        )}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-sm bg-background border border-border" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-sm bg-destructive/20 border border-destructive/40" />
          <span className="text-muted-foreground">Unavailable</span>
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
    </div>
  );
}
