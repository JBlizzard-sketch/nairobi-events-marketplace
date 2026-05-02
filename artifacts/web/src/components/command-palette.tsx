import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useListVendors, useListMyEvents } from "@workspace/api-client-react";
import { Search, Building2, Calendar, ArrowRight, Hash } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  brief_submitted: "Brief Sent",
  quotes_requested: "Awaiting Quotes",
  quotes_received: "Quotes Ready",
  vendor_selected: "Vendor Chosen",
  booked: "Booked",
  completed: "Completed",
  cancelled: "Cancelled",
};

type ResultItem =
  | { type: "event"; item: any }
  | { type: "vendor"; item: any };

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: vendorsData } = useListVendors({ limit: 30, page: 1 });
  const { data: eventsData } = useListMyEvents({ limit: 30, page: 1 });

  const allVendors = useMemo(() => (vendorsData?.vendors ?? []) as any[], [vendorsData]);
  const allEvents = useMemo(() => (eventsData?.events ?? []) as any[], [eventsData]);

  const results = useMemo<ResultItem[]>(() => {
    const q = query.toLowerCase().trim();
    const filteredVendors = q
      ? allVendors.filter(v =>
          v.businessName?.toLowerCase().includes(q) ||
          v.category?.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q)
        )
      : allVendors;
    const filteredEvents = q
      ? allEvents.filter(e =>
          e.title?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q)
        )
      : allEvents;

    return [
      ...filteredEvents.slice(0, 5).map(item => ({ type: "event" as const, item })),
      ...filteredVendors.slice(0, 5).map(item => ({ type: "vendor" as const, item })),
    ];
  }, [query, allVendors, allEvents]);

  const eventResults = results.filter(r => r.type === "event");
  const vendorResults = results.filter(r => r.type === "vendor");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  const navigate = useCallback((result: ResultItem) => {
    if (result.type === "event") setLocation(`/events/${result.item.id}`);
    else setLocation(`/vendors/${result.item.id}`);
    onClose();
  }, [setLocation, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[activeIndex]) {
        navigate(results[activeIndex]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, activeIndex, navigate, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[199] bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-16 sm:top-24 z-[200] mx-auto w-full max-w-xl px-4 animate-in fade-in slide-in-from-top-3 duration-200">
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              placeholder="Search vendors, events…"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
              autoComplete="off"
            />
            <kbd className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Hash className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {query ? `No results for "${query}"` : "Start typing to search…"}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {/* Events section */}
                {eventResults.length > 0 && (
                  <section>
                    <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      My Events
                    </p>
                    {eventResults.map((result, i) => {
                      const e = result.item;
                      const globalIdx = i;
                      const isActive = activeIndex === globalIdx;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isActive ? "bg-primary/10" : "hover:bg-muted/50"
                          }`}
                          onClick={() => navigate(result)}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                        >
                          <div className={`p-1.5 rounded-md flex-shrink-0 ${isActive ? "bg-primary/20" : "bg-muted"}`}>
                            <Calendar className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>
                              {e.title}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize truncate">
                              {STATUS_LABELS[e.status] ?? e.status}
                              {e.eventDate ? ` · ${new Date(e.eventDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}` : ""}
                              {e.city ? ` · ${e.city}` : ""}
                            </p>
                          </div>
                          <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/40"}`} />
                        </button>
                      );
                    })}
                  </section>
                )}

                {/* Vendors section */}
                {vendorResults.length > 0 && (
                  <section>
                    <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                      Vendors
                    </p>
                    {vendorResults.map((result, i) => {
                      const v = result.item;
                      const globalIdx = eventResults.length + i;
                      const isActive = activeIndex === globalIdx;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isActive ? "bg-primary/10" : "hover:bg-muted/50"
                          }`}
                          onClick={() => navigate(result)}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                        >
                          <div className={`p-1.5 rounded-md flex-shrink-0 ${isActive ? "bg-primary/20" : "bg-muted"}`}>
                            <Building2 className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>
                              {v.businessName}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize truncate">
                              {v.category?.replace(/_/g, " ")}
                              {v.city ? ` · ${v.city}` : ""}
                              {v.totalBookings > 0 ? ` · ${v.totalBookings} events` : ""}
                            </p>
                          </div>
                          <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/40"}`} />
                        </button>
                      );
                    })}
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-5">
            {[
              { key: "↑↓", label: "Navigate" },
              { key: "↵", label: "Open" },
              { key: "ESC", label: "Close" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <kbd className="bg-muted px-1 py-0.5 rounded border border-border font-mono text-[10px]">{key}</kbd>
                {label}
              </div>
            ))}
            <div className="ml-auto text-[11px] text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
