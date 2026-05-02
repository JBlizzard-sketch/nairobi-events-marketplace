import { useState } from "react";
import {
  useAdminListVendors,
  useAdminApproveVendor,
  useAdminRejectVendor,
  useAdminSuspendVendor,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2, XCircle, PauseCircle, Users, Building2,
  Globe, Instagram, Mail, AlertTriangle, ShieldCheck, Search, Download,
  Star, Briefcase,
} from "lucide-react";

function exportVendorsCSV(vendors: any[]) {
  const headers = ["Business Name", "Category", "Status", "City", "Email", "Website", "Avg Rating", "Total Reviews", "Applied Date"];
  const rows = vendors.map(v => [
    `"${(v.businessName ?? "").replace(/"/g, '""')}"`,
    v.category ?? "",
    v.status ?? "",
    v.city ?? "",
    v.userEmail ?? "",
    v.websiteUrl ?? "",
    v.averageRating ? Number(v.averageRating).toFixed(1) : "",
    v.totalReviews ?? 0,
    v.createdAt ? new Date(v.createdAt).toLocaleDateString("en-KE") : "",
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vendors-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type DialogMode = "reject" | "suspend" | "approve";

const STATUS_TABS = [
  { value: "pending_review", label: "Pending", icon: AlertTriangle },
  { value: "approved", label: "Approved", icon: ShieldCheck },
  { value: "rejected", label: "Rejected", icon: XCircle },
  { value: "suspended", label: "Suspended", icon: PauseCircle },
  { value: "all", label: "All", icon: Users },
] as const;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending_review: { label: "Pending Review", className: "bg-amber-100 text-amber-800 border-amber-200" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
  suspended: { label: "Suspended", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function AdminVendors() {
  const [activeTab, setActiveTab] = useState<string>("pending_review");
  const [search, setSearch] = useState("");

  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const { data: vendors, isLoading, refetch } = useAdminListVendors(
    statusFilter ? { status: statusFilter as "approved" } : {},
    { query: { refetchInterval: 30000 } as any },
  );

  const approveVendor = useAdminApproveVendor();
  const rejectVendor = useAdminRejectVendor();
  const suspendVendor = useAdminSuspendVendor();

  const [dialogTarget, setDialogTarget] = useState<{ id: string; name: string; mode: DialogMode } | null>(null);
  const [reason, setReason] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const openDialog = (id: string, name: string, mode: DialogMode) => {
    setDialogTarget({ id, name, mode });
    setReason("");
    setApproveNote("");
  };

  const handleAction = async () => {
    if (!dialogTarget) return;
    const { id, mode } = dialogTarget;
    setProcessing(id);
    try {
      if (mode === "approve") {
        await approveVendor.mutateAsync({ vendorId: id, data: { note: approveNote || undefined } as any });
      } else if (mode === "reject") {
        await rejectVendor.mutateAsync({ vendorId: id, data: { reason } });
      } else {
        await suspendVendor.mutateAsync({ vendorId: id, data: { reason } });
      }
      refetch();
    } finally {
      setDialogTarget(null);
      setProcessing(null);
    }
  };

  const tabCounts = STATUS_TABS.reduce(
    (acc, t) => {
      acc[t.value] = "—";
      return acc;
    },
    {} as Record<string, string>,
  );

  const vendorList = (Array.isArray(vendors) ? vendors : []) as any[];
  const filteredVendors = search.trim()
    ? vendorList.filter(v =>
        (v.businessName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (v.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (v.userEmail ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (v.category ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : vendorList;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground mt-1">Review applications, approve, reject, or manage active vendors</p>
        </div>
        {vendorList.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
            onClick={() => exportVendorsCSV(vendorList)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search name, city, email, category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          {STATUS_TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map(({ value }) => (
          <TabsContent key={value} value={value}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-44 w-full rounded-lg" />)}
              </div>
            ) : filteredVendors.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {search.trim() ? "No vendors match your search" : "No vendors here"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {search.trim()
                      ? `Try a different search term`
                      : value === "pending_review"
                      ? "No vendors awaiting review right now."
                      : `No ${value.replace(/_/g, " ")} vendors found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-medium">
                  {search.trim()
                    ? `${filteredVendors.length} of ${vendorList.length} vendor${vendorList.length !== 1 ? "s" : ""}`
                    : `${vendorList.length} vendor${vendorList.length !== 1 ? "s" : ""}`}
                </p>
                {filteredVendors.map((vendor: any) => (
                  <Card key={vendor.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <div className="bg-muted p-2 rounded-md">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{vendor.businessName}</h3>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {vendor.category?.replace(/_/g, " ")}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${STATUS_BADGE[vendor.status]?.className ?? ""}`}
                                >
                                  {STATUS_BADGE[vendor.status]?.label ?? vendor.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{vendor.city}</span>
                              </div>
                            </div>
                          </div>

                          {vendor.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vendor.description}</p>
                          )}

                          {vendor.adminNotes && (
                            <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs text-amber-800 mb-3">
                              <span className="font-semibold">Admin note: </span>{vendor.adminNotes}
                            </div>
                          )}

                          {/* Activity stats row */}
                          {(vendor.averageRating > 0 || vendor.totalReviews > 0 || vendor.totalBookings > 0) && (
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              {vendor.averageRating > 0 && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {Number(vendor.averageRating).toFixed(1)}
                                  {vendor.totalReviews > 0 && (
                                    <span className="font-normal text-amber-600 ml-0.5">
                                      · {vendor.totalReviews} review{vendor.totalReviews !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </span>
                              )}
                              {vendor.totalBookings > 0 && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                  <Briefcase className="h-3 w-3" />
                                  {vendor.totalBookings} booking{vendor.totalBookings !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            {vendor.userEmail && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" /> {vendor.userEmail}
                              </span>
                            )}
                            {vendor.websiteUrl && (
                              <a href={vendor.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                                <Globe className="h-3.5 w-3.5" /> Website
                              </a>
                            )}
                            {vendor.instagramHandle && (
                              <a href={`https://instagram.com/${vendor.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                                <Instagram className="h-3.5 w-3.5" /> @{vendor.instagramHandle}
                              </a>
                            )}
                            <span>Applied {new Date(vendor.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>

                          {vendor.serviceAreas?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {vendor.serviceAreas.map((area: string) => (
                                <Badge key={area} variant="secondary" className="text-xs">{area}</Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 sm:flex-col sm:w-36 flex-shrink-0">
                          {vendor.status !== "approved" && (
                            <Button
                              size="sm"
                              className="flex-1 sm:w-full font-semibold gap-1.5"
                              onClick={() => openDialog(vendor.id, vendor.businessName, "approve")}
                              disabled={processing === vendor.id}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </Button>
                          )}
                          {vendor.status !== "rejected" && vendor.status !== "suspended" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:w-full gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => openDialog(vendor.id, vendor.businessName, "reject")}
                              disabled={processing === vendor.id}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          )}
                          {vendor.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:w-full gap-1.5 text-slate-600"
                              onClick={() => openDialog(vendor.id, vendor.businessName, "suspend")}
                              disabled={processing === vendor.id}
                            >
                              <PauseCircle className="h-3.5 w-3.5" />
                              Suspend
                            </Button>
                          )}
                          {(vendor.status === "rejected" || vendor.status === "suspended") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 sm:w-full gap-1.5 text-muted-foreground text-xs"
                              onClick={() => openDialog(vendor.id, vendor.businessName, "reject")}
                              disabled={processing === vendor.id}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Re-reject
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!dialogTarget} onOpenChange={() => setDialogTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogTarget?.mode === "approve"
                ? `Approve "${dialogTarget?.name}"`
                : dialogTarget?.mode === "reject"
                ? `Reject "${dialogTarget?.name}"`
                : `Suspend "${dialogTarget?.name}"`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {dialogTarget?.mode === "approve" ? (
              <div className="space-y-2">
                <Label>Optional note for vendor</Label>
                <Textarea
                  placeholder="e.g. Welcome to the marketplace! Your portfolio looks great."
                  value={approveNote}
                  onChange={e => setApproveNote(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">The vendor will be notified and can immediately start receiving quote requests.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{dialogTarget?.mode === "reject" ? "Reason for rejection *" : "Reason for suspension *"}</Label>
                <Textarea
                  placeholder={
                    dialogTarget?.mode === "reject"
                      ? "Explain why this application is not approved..."
                      : "Explain why this vendor is being suspended..."
                  }
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">This reason will be shared with the vendor.</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className={`flex-1 font-semibold ${dialogTarget?.mode === "approve" ? "" : "bg-red-600 hover:bg-red-700"}`}
                variant={dialogTarget?.mode === "approve" ? "default" : "destructive"}
                onClick={handleAction}
                disabled={
                  (dialogTarget?.mode !== "approve" && !reason.trim()) ||
                  approveVendor.isPending || rejectVendor.isPending || suspendVendor.isPending
                }
              >
                {dialogTarget?.mode === "approve" ? "Approve Vendor" : dialogTarget?.mode === "reject" ? "Confirm Rejection" : "Confirm Suspension"}
              </Button>
              <Button variant="outline" onClick={() => setDialogTarget(null)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
