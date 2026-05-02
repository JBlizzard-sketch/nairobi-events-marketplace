import { Link } from "wouter";
import { useListMyBookings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS: Record<string, any> = {
  pending: "outline",
  confirmed: "default",
  in_escrow: "default",
  completed: "secondary",
  cancelled: "destructive",
  refunded: "destructive",
};

export default function BookingsList() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bookings, isLoading } = useListMyBookings(
    statusFilter !== "all" ? { status: statusFilter as any } : {}
  );

  const list = (Array.isArray(bookings) ? bookings : []) as any[];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-1">{list.length} booking{list.length !== 1 ? "s" : ""}</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.keys(STATUS_COLORS).map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : list.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm">Accept a quote on one of your events to create your first booking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((booking: any) => (
            <Link key={booking.id} href={`/bookings/${booking.id}`}>
              <div className="flex items-center justify-between p-5 rounded-lg border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary p-2.5 rounded-md hidden sm:flex items-center justify-center">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      Booking #{booking.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                      <span>KES {Number(booking.totalAmount).toLocaleString()}</span>
                      <span>·</span>
                      <span>Platform fee: KES {Number(booking.platformFeeAmount).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(booking.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                  <Badge variant={STATUS_COLORS[booking.status] ?? "secondary"} className="capitalize">
                    {booking.status.replace(/_/g, " ")}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
