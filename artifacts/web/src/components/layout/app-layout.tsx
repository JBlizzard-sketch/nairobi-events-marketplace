import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Home,
  List,
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
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const isActive = (href: string) =>
    location === href || location.startsWith(href + "/");

  const plannerLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/events", label: "My Events", icon: Calendar },
    { href: "/vendors", label: "Vendors", icon: Users },
    { href: "/bookings", label: "Bookings", icon: Briefcase },
    { href: "/analytics", label: "Analytics", icon: PieChart },
    { href: "/budget", label: "Budget AI", icon: Sparkles },
  ];

  const vendorLinks = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: Home },
    { href: "/vendor/requests", label: "Quote Requests", icon: FileText },
    { href: "/vendor/bookings", label: "My Bookings", icon: Briefcase },
    { href: "/vendor/profile", label: "Profile", icon: Settings },
    { href: "/vendor/availability", label: "Availability", icon: Calendar },
  ];

  const adminLinks = [
    { href: "/admin", label: "Overview", icon: BarChart },
    { href: "/admin/users", label: "Users", icon: UserCog },
    { href: "/admin/vendors", label: "Vendors", icon: Users },
    { href: "/admin/events", label: "Events", icon: CalendarDays },
    { href: "/admin/bookings", label: "Bookings", icon: Briefcase },
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

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/">
            <h1 className="text-xl font-bold text-primary tracking-tight cursor-pointer">
              Nairobi Events
            </h1>
          </Link>
          <div className="mt-1 text-xs text-muted-foreground uppercase font-semibold tracking-wider">
            {role} Portal
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link key={link.href} href={link.href} className="block">
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </div>
              </Link>
            );
          })}

          {/* Notification bell with live badge — planners and vendors */}
          {showNotificationBell && (
            <NotificationBell active={isActive("/notifications")} />
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
