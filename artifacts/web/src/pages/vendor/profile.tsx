import { useState, useEffect } from "react";
import {
  useGetMyVendorProfile,
  useUpdateVendorProfile,
  useCreateVendorProfile,
  useSubmitVendorProfileForReview,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Save, Plus, X, Send, CheckCircle2, Clock3, XCircle, PauseCircle } from "lucide-react";

const CATEGORIES = [
  "catering", "mc", "photography", "videography", "floristry",
  "av_technical", "tent_furniture", "security", "entertainment", "decor", "transportation", "other"
];

const STATUS_INFO: Record<string, { icon: any; color: string; title: string; desc: string }> = {
  pending_review: {
    icon: Clock3,
    color: "text-amber-600",
    title: "Under Review",
    desc: "Your profile has been submitted and is being reviewed by our team. You'll be notified within 1–2 business days.",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    title: "Approved",
    desc: "Your profile is active and visible to planners. You're receiving quote requests.",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-600",
    title: "Not Approved",
    desc: "Your application was not approved. Update your profile below and resubmit.",
  },
  suspended: {
    icon: PauseCircle,
    color: "text-slate-600",
    title: "Suspended",
    desc: "Your account is suspended. Contact support for assistance.",
  },
};

export default function VendorProfileEdit() {
  const { data: profile, isLoading, refetch } = useGetMyVendorProfile();
  const update = useUpdateVendorProfile();
  const create = useCreateVendorProfile();
  const submit = useSubmitVendorProfileForReview();

  const p = profile as any;

  const [form, setForm] = useState({
    businessName: "",
    category: "catering",
    description: "",
    city: "Nairobi",
    websiteUrl: "",
    instagramHandle: "",
    serviceAreas: [] as string[],
  });
  const [areaInput, setAreaInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (p) {
      setForm({
        businessName: p.businessName ?? "",
        category: p.category ?? "catering",
        description: p.description ?? "",
        city: p.city ?? "Nairobi",
        websiteUrl: p.websiteUrl ?? "",
        instagramHandle: p.instagramHandle ?? "",
        serviceAreas: p.serviceAreas ?? [],
      });
    }
  }, [profile]);

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const addArea = () => {
    if (areaInput.trim() && !form.serviceAreas.includes(areaInput.trim())) {
      set("serviceAreas", [...form.serviceAreas, areaInput.trim()]);
      setAreaInput("");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (p) {
        await update.mutateAsync({ data: form as any });
      } else {
        await create.mutateAsync({ data: form as any });
      }
      refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submit.mutateAsync();
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to submit. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = p && form.businessName.trim() && ["rejected", "suspended", undefined].includes(p.status) || (!p?.status && form.businessName.trim());
  const showSubmitButton = p && p.status !== "pending_review" && p.status !== "approved";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const statusInfo = p?.status ? STATUS_INFO[p.status] : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Profile</h1>
          <p className="text-muted-foreground mt-1">
            {p
              ? "Manage your business information and vetting status"
              : "Create your vendor profile to start receiving quote requests"}
          </p>
        </div>
        {p?.status && statusInfo && (
          <Badge
            variant="outline"
            className={`capitalize text-xs gap-1.5 px-3 py-1 ${statusInfo.color}`}
          >
            <statusInfo.icon className="h-3.5 w-3.5" />
            {p.status.replace(/_/g, " ")}
          </Badge>
        )}
      </div>

      {statusInfo && (
        <Alert className={
          p?.status === "approved" ? "border-emerald-300 bg-emerald-50" :
          p?.status === "pending_review" ? "border-amber-300 bg-amber-50" :
          p?.status === "rejected" ? "border-red-300 bg-red-50" :
          "border-slate-300 bg-slate-50"
        }>
          <statusInfo.icon className={`h-4 w-4 ${statusInfo.color}`} />
          <AlertTitle className="font-semibold">{statusInfo.title}</AlertTitle>
          <AlertDescription>
            {statusInfo.desc}
            {p?.adminNotes && p.status !== "approved" && (
              <p className="mt-1"><span className="font-medium">Admin note:</span> {p.adminNotes}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Business Details</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Business Name</Label>
            <Input
              placeholder="e.g. Savanna Catering Co."
              value={form.businessName}
              onChange={e => set("businessName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe your services, experience, and what makes you stand out..."
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Primary City</Label>
            <Select value={form.city} onValueChange={v => set("city", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"].map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Online Presence</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input
              placeholder="https://yourwebsite.co.ke"
              value={form.websiteUrl}
              onChange={e => set("websiteUrl", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Instagram Handle</Label>
            <Input
              placeholder="@yourhandle"
              value={form.instagramHandle}
              onChange={e => set("instagramHandle", e.target.value.replace("@", ""))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader><CardTitle>Service Areas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Westlands, Karen, CBD"
              value={areaInput}
              onChange={e => setAreaInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addArea()}
            />
            <Button variant="outline" onClick={addArea} className="gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          {form.serviceAreas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.serviceAreas.map(area => (
                <Badge key={area} variant="secondary" className="gap-1.5">
                  {area}
                  <button onClick={() => set("serviceAreas", form.serviceAreas.filter(a => a !== area))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full font-semibold gap-2"
          onClick={handleSave}
          disabled={saving || !form.businessName.trim()}
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : saved ? "Saved!" : p ? "Save Changes" : "Create Profile"}
        </Button>

        {showSubmitButton && (
          <div className="space-y-2">
            {submitError && (
              <p className="text-sm text-red-600 text-center">{submitError}</p>
            )}
            <Button
              size="lg"
              variant="outline"
              className="w-full font-semibold gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleSubmitForReview}
              disabled={submitting || !form.businessName.trim()}
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : p?.status === "rejected" ? "Resubmit for Review" : "Submit for Review"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Make sure your profile is complete before submitting. Our team will review within 1–2 business days.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
