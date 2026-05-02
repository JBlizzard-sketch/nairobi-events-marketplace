import {
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  CheckCheck,
  FileText,
  ShieldCheck,
  CreditCard,
  Unlock,
  Star,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useState } from "react";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; getLink?: (n: any) => string | null }
> = {
  quote_requested: {
    label: "Quote Request",
    icon: <FileText className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-50 border-blue-100",
    getLink: (n) => {
      const match = (n.body ?? n.message ?? "").match(/[a-f0-9-]{36}/i);
      return match ? `/events/${match[0]}` : "/events";
    },
  },
  quote_received: {
    label: "New Quote",
    icon: <FileText className="h-4 w-4" />,
    color: "text-primary bg-primary/5 border-primary/15",
    getLink: (n) => {
      const match = (n.body ?? n.message ?? "").match(/[a-f0-9-]{36}/i);
      return match ? `/events/${match[0]}` : "/events";
    },
  },
  booking_confirmed: {
    label: "Booking Confirmed",
    icon: <ShieldCheck className="h-4 w-4" />,
    color: "text-green-700 bg-green-50 border-green-100",
    getLink: (n) => {
      const match = (n.body ?? n.message ?? "").match(/[a-f0-9-]{36}/i);
      return match ? `/bookings/${match[0]}` : "/bookings";
    },
  },
  payment_received: {
    label: "Payment",
    icon: <CreditCard className="h-4 w-4" />,
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    getLink: () => "/bookings",
  },
  payment_released: {
    label: "Payment Released",
    icon: <Unlock className="h-4 w-4" />,
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    getLink: () => "/bookings",
  },
  review_reminder: {
    label: "Review",
    icon: <Star className="h-4 w-4" />,
    color: "text-amber-700 bg-amber-50 border-amber-100",
    getLink: (n) => {
      const match = (n.body ?? n.message ?? "").match(/[a-f0-9-]{36}/i);
      return match ? `/bookings/${match[0]}` : "/bookings";
    },
  },
};

const ACTION_LABELS: Record<string, string> = {
  quote_requested: "View Event",
  quote_received: "Compare Quotes",
  booking_confirmed: "View Booking",
  payment_received: "View Bookings",
  payment_released: "View Bookings",
  review_reminder: "Leave Review",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

export default function Notifications() {
  const [tab, setTab] = useState<"all" | "unread">("all");

  const { data, isLoading, refetch } = useListNotifications(
    { limit: 50 },
    { query: { refetchInterval: 30_000 } as any },
  );
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const allNotifications = (data as any)?.notifications ?? [];
  const unreadCount = (data as any)?.unreadCount ?? 0;
  const notificationList = tab === "unread"
    ? allNotifications.filter((n: any) => !n.isRead)
    : allNotifications;

  const handleMarkRead = async (notifId: string) => {
    await markRead.mutateAsync({ notificationId: notifId });
    refetch();
  };

  const handleMarkAll = async () => {
    await markAll.mutateAsync();
    refetch();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* All / Unread filter tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {(["all", "unread"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              tab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : "Unread"}
            {t === "unread" && unreadCount > 0 && (
              <span className={`inline-flex items-center justify-center h-4.5 min-w-[1.125rem] px-1 rounded-full text-[10px] font-bold leading-none ${
                tab === "unread" ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : notificationList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            {tab === "unread" ? (
              <>
                <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  No unread notifications right now.
                </p>
                <Button variant="outline" size="sm" onClick={() => setTab("all")}>
                  View all notifications
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-sm">
                  You'll be notified when quotes arrive, bookings update, and payments are processed.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notificationList.map((n: any) => {
            const cfg = TYPE_CONFIG[n.type] ?? {
              label: n.type,
              icon: <Bell className="h-4 w-4" />,
              color: "text-muted-foreground bg-muted border-border",
              getLink: null,
            };
            const actionLink = cfg.getLink ? cfg.getLink(n) : null;
            const actionLabel = ACTION_LABELS[n.type] ?? "View";

            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all",
                  !n.isRead ? "bg-primary/5 border-primary/20" : "bg-card border-border",
                )}
              >
                {/* Type icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center mt-0.5",
                    cfg.color,
                  )}
                >
                  {cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {cfg.label}
                        </span>
                        {!n.isRead && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="font-semibold text-sm leading-snug">{n.title}</p>
                      {(n.body ?? n.message) && (
                        <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                          {n.body ?? n.message}
                        </p>
                      )}

                      {/* Action link */}
                      {actionLink && (
                        <Link
                          href={actionLink}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-1.5"
                          onClick={() => { if (!n.isRead) handleMarkRead(n.id); }}
                        >
                          {actionLabel}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs h-7 px-2 text-muted-foreground flex-shrink-0 self-center"
                  >
                    Mark read
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
