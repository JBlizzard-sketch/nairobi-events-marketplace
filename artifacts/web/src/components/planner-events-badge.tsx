import { Link } from "wouter";
import { Calendar } from "lucide-react";
import { useListMyEvents } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface Props {
  active?: boolean;
}

export function PlannerEventsLink({ active }: Props) {
  const { data } = useListMyEvents(
    { page: 1, limit: 50 },
    { query: { refetchInterval: 60_000 } as any },
  );
  const events = (data?.events ?? []) as any[];
  const actionNeeded = events.filter(
    (e: any) => e.status === "quotes_received",
  ).length;

  return (
    <Link href="/events" className="block">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Calendar className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm flex-1">My Events</span>
        {actionNeeded > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground leading-none">
            {actionNeeded > 9 ? "9+" : actionNeeded}
          </span>
        )}
      </div>
    </Link>
  );
}
