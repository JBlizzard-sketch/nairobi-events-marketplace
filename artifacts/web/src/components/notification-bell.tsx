import { Link } from "wouter";
import { Bell } from "lucide-react";
import { useListNotifications } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface Props {
  active?: boolean;
}

export function NotificationBell({ active }: Props) {
  const { data } = useListNotifications(
    { limit: 1 },
    { query: { refetchInterval: 30_000 } as any },
  );
  const unread = (data as any)?.unreadCount ?? 0;

  return (
    <Link href="/notifications" className="block">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors relative",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <span className="relative flex-shrink-0">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        <span>Notifications</span>
        {unread > 0 && (
          <span className="ml-auto text-xs font-semibold text-destructive">
            {unread}
          </span>
        )}
      </div>
    </Link>
  );
}
