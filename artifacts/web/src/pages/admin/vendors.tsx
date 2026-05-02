import { useState } from "react";
import { useAdminListPendingVendors, useAdminApproveVendor, useAdminSuspendVendor } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Users, Building2, Globe, Instagram } from "lucide-react";

export default function AdminVendors() {
  const { data: vendors, isLoading, refetch } = useAdminListPendingVendors();
  const approveVendor = useAdminApproveVendor();
  const suspendVendor = useAdminSuspendVendor();

  const [suspendTarget, setSuspendTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const vendorList = (Array.isArray(vendors) ? vendors : []) as any[];

  const handleApprove = async (vendorId: string) => {
    setProcessing(vendorId);
    await approveVendor.mutateAsync({ vendorId });
    refetch();
    setProcessing(null);
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setProcessing(suspendTarget);
    await suspendVendor.mutateAsync({ vendorId: suspendTarget, data: { reason } });
    setSuspendTarget(null);
    setReason("");
    refetch();
    setProcessing(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Vendor Approvals</h1>
        <p className="text-muted-foreground mt-1">
          {isLoading ? "Loading..." : `${vendorList.length} vendor${vendorList.length !== 1 ? "s" : ""} awaiting review`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      ) : vendorList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">All clear</h3>
            <p className="text-muted-foreground text-sm">No vendors pending approval</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {vendorList.map((vendor: any) => (
            <Card key={vendor.id} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <div className="bg-muted p-2 rounded-md">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{vendor.businessName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="capitalize text-xs">
                            {vendor.category?.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{vendor.city}</span>
                        </div>
                      </div>
                    </div>

                    {vendor.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{vendor.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
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
                    <Button
                      className="flex-1 sm:w-full font-semibold gap-2"
                      onClick={() => handleApprove(vendor.id)}
                      disabled={processing === vendor.id}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 sm:w-full gap-2"
                      onClick={() => setSuspendTarget(vendor.id)}
                      disabled={processing === vendor.id}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!suspendTarget} onOpenChange={() => { setSuspendTarget(null); setReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason for rejection</Label>
              <Textarea
                placeholder="Explain why this vendor application is being rejected..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1 font-semibold"
                onClick={handleSuspend}
                disabled={!reason.trim()}
              >
                Confirm Rejection
              </Button>
              <Button variant="outline" onClick={() => { setSuspendTarget(null); setReason(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
