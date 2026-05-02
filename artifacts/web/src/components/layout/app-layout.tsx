import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Home,
  Users,
  Settings,
  LogOut,
  Briefcase,
  FileText,
  BarChart,
  Sparkles,
  CalendarDays,
  UserCog,
  PieChart,
  Menu,
  X,
  SlidersHorizontal,
  Search,
  Heart,
  TrendingUp,
  Sun,
  Moon,
  Star,
  HelpCircle,
  BookTemplate,
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { CommandPalette } from "@/components/command-palette";
import { VendorRequestsLink } from "@/components/vendor-requests-badge";
import { PlannerEventsLink } from "@/components/planner-events-badge";
import { AdminVendorsLink } from "@/components/admin-vendors-badge";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Close drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const isActive = (href: string) => {
    if (location === href) return true;
    if (href === "/vendors") return location.startsWith("/vendors/") && !location.startsWith("/vendors/saved");
    return location.startsWith(href + "/");
  };

  const plannerLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/events", label: "My Events", icon: Calendar },
    { href: "/vendors", label: "Vendors", icon: Users },
    { href: "/vendors/saved", label: "Saved Vendors", icon: Heart },
    { href: "/bookings", label: "Bookings", icon: Briefcase },
    { href: "/analytics", label: "Analytics", icon: PieChart },
    { href: "/budget", label: "Budget AI", icon: Sparkles },
    { href: "/account", label: "Account", icon: UserCog },
  ];

  const vendorLinks = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: Home },
    { href: "/vendor/requests", label: "Quote Requests", icon: FileText },
    { href: "/vendor/bookings", label: "My Bookings", icon: Briefcase },
    { href: "/vendor/profile", label: "Profile", icon: Settings },
    { href: "/vendor/availability", label: "Availability", icon: Calendar },
    { href: "/vendor/analytics", label: "Analytics", icon: TrendingUp },
    { href: "/vendor/reviews", label: "My Reviews", icon: Star },
    { href: "/vendor/templates", label: "Quote Templates", icon: BookTemplate },
    { href: "/account", label: "Account", icon: UserCog },
  ];

  const adminLinks = [
    { href: "/admin", label: "Overview", icon: BarChart },
    { href: "/admin/users", label: "Users", icon: UserCog },
    { href: "/admin/vendors", label: "Vendors", icon: Users },
    { href: "/admin/events", label: "Events", icon: CalendarDays },
    { href: "/admin/bookings", label: "Bookings", icon: Briefcase },
    { href: "/admin/settings", label: "Settings", icon: SlidersHorizontal },
    { href: "/account", label: "Account", icon: Settings },
  ];

  const links =
    role === "planner"
      ? plannerLinks
      : role === "vendor"
        ? vendorLinks
        : role === "admin"
          ? adminLinks
          : [];

  const showNotificationBell = role === "planner" || role === "vendor";

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <h1 className="text-lg font-bold text-primary tracking-tight cursor-pointer">
              Nairobi Events
            </h1>
          </Link>
          <div className="mt-0.5 text-xs text-muted-foreground uppercase font-semibold tracking-wider">
            {role} Portal
          </div>
        </div>
        {/* Close button — only visible on mobile */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          // Vendor "Quote Requests" gets a live pending-count badge
          if (role === "vendor" && link.href === "/vendor/requests") {
            return <VendorRequestsLink key={link.href} active={isActive(link.href)} />;
          }
          // Planner "My Events" gets a live action-needed count badge
          if (role === "planner" && link.href === "/events") {
            return <PlannerEventsLink key={link.href} active={isActive(link.href)} />;
          }
          // Admin "Vendors" gets a live pending-approval badge
          if (role === "admin" && link.href === "/admin/vendors") {
            return <AdminVendorsLink key={link.href} active={isActive(link.href)} />;
          }
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link key={link.href} href={link.href} className="block">
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4.5 w-4.5 h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
              </div>
            </Link>
          );
        })}

        {showNotificationBell && (
          <NotificationBell active={isActive("/notifications")} />
        )}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        {/* Search shortcut */}
        <button
          onClick={() => { setPaletteOpen(true); setMobileOpen(false); }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </span>
          <kbd className="hidden md:inline-flex text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border font-mono">
            ⌘K
          </kbd>
        </button>
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
        >
          <span className="flex items-center gap-2">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? "Light mode" : "Dark mode"}
          </span>
        </button>
        {/* Help / FAQ */}
        <Link href="/faq">
          <button
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm"
          >
            <HelpCircle className="h-4 w-4" />
            Help &amp; FAQ
          </button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </>
  );

  // Scroll the main content to top whenever the route changes
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [location]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Command palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* ── Mobile top bar ─────────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <Link href="/">
          <span className="text-base font-bold text-primary tracking-tight">Nairobi Events</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-h-[calc(100vh-56px)] md:min-h-screen">
        {/* ── Sidebar ── desktop: always visible; mobile: slide-in drawer ───── */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col
            transform transition-transform duration-200 ease-in-out
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
            md:relative md:translate-x-0 md:flex md:w-64 md:flex-shrink-0
          `}
        >
          <SidebarContent />
        </aside>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-hidden">
          <div ref={scrollRef} className="h-full overflow-y-auto p-5 md:p-8">
            <div className="max-w-6xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
