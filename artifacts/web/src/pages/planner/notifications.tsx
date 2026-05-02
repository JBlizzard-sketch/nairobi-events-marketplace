import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCheck, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  quote_received: "New Quote",
  quote_accepted: "Quote Accepted",
  booking_confirmed: "Booking Confirmed",
  payment_received: "Payment Received",
  event_reminder: "Event Reminder",
  review_request: "Review Request",
  vendor_approved: "Vendor Approved",
  general: "Notification",
};

export default function Notifications() {
  const { data, isLoading, refetch } = useListNotifications({ limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications = (data as any)?.notifications ?? [];
  const unreadCount = (data as any)?.unreadCount ?? 0;

  const handleMarkRead = async (notifId: string) => {
    await markRead.mutateAsync({ notificationId: notifId });
    refetch();
  };

  const handleMarkAll = async () => {
    await markAll.mutateAsync();
    refetch();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground text-sm">You'll be notified when quotes arrive and bookings are updated.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border transition-all",
                !n.isRead ? "bg-primary/5 border-primary/20" : "bg-card"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                !n.isRead ? "bg-primary" : "bg-transparent"
              )}>
                {n.isRead && <Circle className="h-2 w-2 text-muted-foreground/30" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    <p className="font-medium text-sm mt-0.5">{n.title}</p>
                    {n.message && (
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(n.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
              {!n.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs h-7 px-2 text-muted-foreground flex-shrink-0"
                >
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
