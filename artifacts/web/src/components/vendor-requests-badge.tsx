import { Link } from "wouter";
import { FileText } from "lucide-react";
import { useListMyQuoteRequests } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface Props {
  active?: boolean;
}

export function VendorRequestsLink({ active }: Props) {
  const { data } = useListMyQuoteRequests(
    {},
    { query: { refetchInterval: 30_000 } as any },
  );
  const requests = Array.isArray(data) ? data : [];
  const pending = requests.filter((r: any) => r.status === "requested").length;

  return (
    <Link href="/vendor/requests" className="block">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <FileText className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm flex-1">Quote Requests</span>
        {pending > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground leading-none">
            {pending > 9 ? "9+" : pending}
          </span>
        )}
      </div>
    </Link>
  );
}
