import { useState } from "react";
import { useAdminListUsers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, Users, Building2, ShieldCheck, Calendar,
  Briefcase, Star, UserX,
} from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  planner: { label: "Planner", className: "bg-blue-100 text-blue-800 border-blue-200" },
  vendor: { label: "Vendor", className: "bg-violet-100 text-violet-800 border-violet-200" },
  admin: { label: "Admin", className: "bg-amber-100 text-amber-800 border-amber-200" },
};

const VENDOR_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending_review: { label: "Pending Review", className: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
  suspended: { label: "Suspended", className: "bg-red-200 text-red-900 border-red-300" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string, email: string) {
  if (name.trim()) {
    const parts = name.trim().split(" ");
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAdminListUsers({
    role: roleFilter !== "all" ? (roleFilter as any) : undefined,
    search: search || undefined,
    page: 1,
    limit: 100,
  });

  const userList = (data?.users ?? []) as any[];

  const counts = {
    planner: userList.filter(u => u.role === "planner").length,
    vendor: userList.filter(u => u.role === "vendor").length,
    admin: userList.filter(u => u.role === "admin").length,
    inactive: userList.filter(u => !u.isActive).length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Users</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading ? "Loading..." : `${data?.total ?? 0} total users`}
        </p>
      </div>

      {/* Role summary chips */}
      {!isLoading && userList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(["planner", "vendor", "admin"] as const).map(role => {
            const cfg = ROLE_CONFIG[role];
            return (
              <button
                key={role}
                onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${cfg.className} ${
                  roleFilter === role ? "ring-2 ring-offset-1 ring-primary/40 shadow-sm" : "opacity-70 hover:opacity-100"
                }`}
              >
                {cfg.label} · {counts[role]}
              </button>
            );
          })}
          {counts.inactive > 0 && (
            <button
              onClick={() => {}}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-muted text-muted-foreground opacity-70"
            >
              Inactive · {counts.inactive}
            </button>
          )}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="planner">Planner</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : userList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold mb-1">No users found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {userList.map((u: any) => {
            const roleCfg = ROLE_CONFIG[u.role] ?? { label: u.role, className: "bg-muted text-muted-foreground" };
            const vendorCfg = u.vendorStatus ? VENDOR_STATUS_CONFIG[u.vendorStatus] : null;
            const displayName = u.fullName?.trim() || u.email;
            const isInactive = !u.isActive;

            return (
              <Card key={u.id} className={`shadow-sm ${isInactive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={displayName} />}
                      <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                        {initials(u.fullName ?? "", u.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold truncate">{displayName}</span>
                        <Badge className={`text-xs ${roleCfg.className}`}>{roleCfg.label}</Badge>
                        {vendorCfg && (
                          <Badge className={`text-xs ${vendorCfg.className}`}>{vendorCfg.label}</Badge>
                        )}
                        {isInactive && (
                          <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                            <UserX className="h-3 w-3" /> Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{u.email}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                        {u.vendorBusinessName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {u.vendorBusinessName}
                            {u.vendorCategory && <span className="capitalize">({u.vendorCategory.replace(/_/g, " ")})</span>}
                          </span>
                        )}
                        {u.role === "planner" && u.eventCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {u.eventCount} event{u.eventCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        {u.bookingCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {u.bookingCount} booking{u.bookingCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Joined {formatDate(u.createdAt)}
                        </span>
                        {u.phone && (
                          <span>{u.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
