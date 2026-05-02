import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useListVendors, useListMyEvents } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Search, Building2, Calendar, ArrowRight, Hash,
  Home, FileText, Briefcase, Settings, TrendingUp, PieChart,
  Sparkles, Heart, Users, BarChart, CalendarDays, UserCog,
  SlidersHorizontal, Plus, HelpCircle, Star,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  sub: string;
}

type ResultItem =
  | { type: "nav"; item: NavItem }
  | { type: "event"; item: any }
  | { type: "vendor"; item: any };

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

const PLANNER_NAV: NavItem[] = [
  { href: "/events/new",     label: "New Event Brief",    icon: Plus,          sub: "Start planning a new event" },
  { href: "/dashboard",      label: "Dashboard",          icon: Home,          sub: "Your planner overview" },
  { href: "/events",         label: "My Events",          icon: Calendar,      sub: "All your event briefs" },
  { href: "/bookings",       label: "Bookings",           icon: Briefcase,     sub: "Your confirmed vendors" },
  { href: "/vendors",        label: "Vendor Directory",   icon: Users,         sub: "Discover vetted vendors" },
  { href: "/vendors/saved",  label: "Saved Vendors",      icon: Heart,         sub: "Your shortlisted vendors" },
  { href: "/budget",         label: "Budget AI",          icon: Sparkles,      sub: "AI-powered budget planning" },
  { href: "/analytics",      label: "Analytics",          icon: PieChart,      sub: "Spend & booking insights" },
  { href: "/account",        label: "Account Settings",   icon: UserCog,       sub: "Profile & preferences" },
  { href: "/faq",            label: "Help & FAQ",         icon: HelpCircle,    sub: "Answers to common questions" },
];

const VENDOR_NAV: NavItem[] = [
  { href: "/vendor/dashboard",     label: "Dashboard",          icon: Home,          sub: "Your vendor overview" },
  { href: "/vendor/requests",      label: "Quote Requests",     icon: FileText,      sub: "Incoming requests to bid on" },
  { href: "/vendor/bookings",      label: "My Bookings",        icon: Briefcase,     sub: "Confirmed jobs & earnings" },
  { href: "/vendor/profile",       label: "My Profile",         icon: Settings,      sub: "Edit your public listing" },
  { href: "/vendor/availability",  label: "Availability",       icon: CalendarDays,  sub: "Block unavailable dates" },
  { href: "/vendor/reviews",       label: "My Reviews",         icon: Star,          sub: "Client feedback & ratings" },
  { href: "/vendor/analytics",     label: "Analytics",          icon: TrendingUp,    sub: "Performance & revenue" },
  { href: "/account",              label: "Account Settings",   icon: UserCog,       sub: "Profile & preferences" },
  { href: "/faq",                  label: "Help & FAQ",         icon: HelpCircle,    sub: "Answers to common questions" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin",           label: "Platform Overview",  icon: BarChart,         sub: "Stats & KPIs" },
  { href: "/admin/users",     label: "Users",              icon: UserCog,          sub: "All user accounts" },
  { href: "/admin/vendors",   label: "Vendors",            icon: Users,            sub: "Vetting & management" },
  { href: "/admin/events",    label: "Events",             icon: CalendarDays,     sub: "All platform events" },
  { href: "/admin/bookings",  label: "Bookings",           icon: Briefcase,        sub: "All bookings & disputes" },
  { href: "/admin/settings",  label: "Settings",           icon: SlidersHorizontal, sub: "Platform configuration" },
  { href: "/account",         label: "Account Settings",   icon: UserCog,          sub: "Your admin profile" },
  { href: "/faq",             label: "Help & FAQ",         icon: HelpCircle,       sub: "Answers to common questions" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { role } = useAuth();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const navItems: NavItem[] = useMemo(() => {
    if (role === "vendor") return VENDOR_NAV;
    if (role === "admin") return ADMIN_NAV;
    return PLANNER_NAV;
  }, [role]);

  const showVendors = role === "planner" || role === "admin";
  const showEvents = role === "planner";

  const { data: vendorsData } = useListVendors(
    { limit: 30, page: 1 },
    { query: { enabled: showVendors } as any },
  );
  const { data: eventsData } = useListMyEvents(
    { limit: 30, page: 1 },
    { query: { enabled: showEvents } as any },
  );

  const allVendors = useMemo(() => (vendorsData?.vendors ?? []) as any[], [vendorsData]);
  const allEvents = useMemo(() => (eventsData?.events ?? []) as any[], [eventsData]);

  const results = useMemo<ResultItem[]>(() => {
    const q = query.toLowerCase().trim();

    // Nav shortcuts — filter by label/sub when query present, show all when empty
    const filteredNav: ResultItem[] = (
      q
        ? navItems.filter(n =>
            n.label.toLowerCase().includes(q) ||
            n.sub.toLowerCase().includes(q),
          )
        : navItems
    ).map(item => ({ type: "nav" as const, item }));

    if (!q) {
      // Empty state: show nav shortcuts + up to 3 recent events (no vendor list)
      const recentEvents: ResultItem[] = showEvents
        ? allEvents.slice(0, 3).map(item => ({ type: "event" as const, item }))
        : [];
      return [...filteredNav, ...recentEvents];
    }

    // With query: filter events + vendors too
    const filteredEvents: ResultItem[] = showEvents
      ? allEvents
          .filter(e =>
            e.title?.toLowerCase().includes(q) ||
            e.venue?.toLowerCase().includes(q) ||
            e.city?.toLowerCase().includes(q),
          )
          .slice(0, 5)
          .map(item => ({ type: "event" as const, item }))
      : [];

    const filteredVendors: ResultItem[] = showVendors
      ? allVendors
          .filter(v =>
            v.businessName?.toLowerCase().includes(q) ||
            v.category?.toLowerCase().includes(q) ||
            v.description?.toLowerCase().includes(q) ||
            v.city?.toLowerCase().includes(q),
          )
          .slice(0, 5)
          .map(item => ({ type: "vendor" as const, item }))
      : [];

    return [...filteredNav, ...filteredEvents, ...filteredVendors];
  }, [query, navItems, allVendors, allEvents, showEvents, showVendors]);

  // Split into typed groups for section headers
  const navResults    = results.filter(r => r.type === "nav");
  const eventResults  = results.filter(r => r.type === "event");
  const vendorResults = results.filter(r => r.type === "vendor");

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  const navigate = useCallback((result: ResultItem) => {
    if (result.type === "nav") setLocation(result.item.href);
    else if (result.type === "event") setLocation(`/events/${result.item.id}`);
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

  // Helper: given a result, find its flat index in `results`
  const flatIndex = (result: ResultItem) => results.indexOf(result);

  function NavRow({ result }: { result: ResultItem & { type: "nav" } }) {
    const idx = flatIndex(result);
    const isActive = activeIndex === idx;
    const Icon = result.item.icon;
    return (
      <button
        type="button"
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          isActive ? "bg-primary/10" : "hover:bg-muted/50"
        }`}
        onClick={() => navigate(result)}
        onMouseEnter={() => setActiveIndex(idx)}
      >
        <div className={`p-1.5 rounded-md flex-shrink-0 ${isActive ? "bg-primary/20" : "bg-muted"}`}>
          <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>{result.item.label}</p>
          <p className="text-xs text-muted-foreground truncate">{result.item.sub}</p>
        </div>
        <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/30"}`} />
      </button>
    );
  }

  function EventRow({ result }: { result: ResultItem & { type: "event" } }) {
    const idx = flatIndex(result);
    const isActive = activeIndex === idx;
    const e = result.item;
    return (
      <button
        type="button"
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          isActive ? "bg-primary/10" : "hover:bg-muted/50"
        }`}
        onClick={() => navigate(result)}
        onMouseEnter={() => setActiveIndex(idx)}
      >
        <div className={`p-1.5 rounded-md flex-shrink-0 ${isActive ? "bg-primary/20" : "bg-muted"}`}>
          <Calendar className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>{e.title}</p>
          <p className="text-xs text-muted-foreground capitalize truncate">
            {STATUS_LABELS[e.status] ?? e.status}
            {e.eventDate ? ` · ${new Date(e.eventDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}` : ""}
            {e.city ? ` · ${e.city}` : ""}
          </p>
        </div>
        <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/30"}`} />
      </button>
    );
  }

  function VendorRow({ result }: { result: ResultItem & { type: "vendor" } }) {
    const idx = flatIndex(result);
    const isActive = activeIndex === idx;
    const v = result.item;
    return (
      <button
        type="button"
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          isActive ? "bg-primary/10" : "hover:bg-muted/50"
        }`}
        onClick={() => navigate(result)}
        onMouseEnter={() => setActiveIndex(idx)}
      >
        <div className={`p-1.5 rounded-md flex-shrink-0 ${isActive ? "bg-primary/20" : "bg-muted"}`}>
          <Building2 className={`h-3.5 w-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? "text-primary" : ""}`}>{v.businessName}</p>
          <p className="text-xs text-muted-foreground capitalize truncate">
            {v.category?.replace(/_/g, " ")}
            {v.city ? ` · ${v.city}` : ""}
            {v.totalBookings > 0 ? ` · ${v.totalBookings} events` : ""}
          </p>
        </div>
        <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/30"}`} />
      </button>
    );
  }

  const isEmpty = results.length === 0;
  const sectionLabel = query ? "Navigate" : "Quick Navigation";

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
              placeholder="Search or navigate…"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
              autoComplete="off"
            />
            <kbd className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border font-mono">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[min(70vh,28rem)] overflow-y-auto">
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Hash className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {query ? `No results for "${query}"` : "Loading…"}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {/* Navigation section */}
                {navResults.length > 0 && (
                  <section>
                    <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {sectionLabel}
                    </p>
                    {navResults.map((result, i) => (
                      <NavRow key={`nav-${i}`} result={result as any} />
                    ))}
                  </section>
                )}

                {/* Events section */}
                {eventResults.length > 0 && (
                  <section>
                    <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                      {query ? "Events" : "Recent Events"}
                    </p>
                    {eventResults.map((result, i) => (
                      <EventRow key={`event-${i}`} result={result as any} />
                    ))}
                  </section>
                )}

                {/* Vendors section */}
                {vendorResults.length > 0 && (
                  <section>
                    <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                      Vendors
                    </p>
                    {vendorResults.map((result, i) => (
                      <VendorRow key={`vendor-${i}`} result={result as any} />
                    ))}
                  </section>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-5">
            {[
              { key: "↑↓", label: "Navigate" },
              { key: "↵",  label: "Open" },
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
