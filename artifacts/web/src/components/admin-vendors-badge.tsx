import { Link } from "wouter";
import { Users } from "lucide-react";
import { useAdminGetStats } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface Props {
  active?: boolean;
}

export function AdminVendorsLink({ active }: Props) {
  const { data } = useAdminGetStats(
    { query: { refetchInterval: 60_000 } } as any,
  );
  const pending = (data as any)?.pendingVendors ?? 0;

  return (
    <Link href="/admin/vendors" className="block">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Users className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm flex-1">Vendors</span>
        {pending > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white leading-none">
            {pending > 9 ? "9+" : pending}
          </span>
        )}
      </div>
    </Link>
  );
}
