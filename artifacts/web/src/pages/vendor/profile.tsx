import { useState, useEffect } from "react";
import { useGetMyVendorProfile, useUpdateVendorProfile, useCreateVendorProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Plus, X } from "lucide-react";

const CATEGORIES = [
  "catering", "mc", "photography", "videography", "floristry",
  "av_technical", "tent_furniture", "security", "entertainment", "decor", "transportation", "other"
];

export default function VendorProfileEdit() {
  const { data: profile, isLoading, refetch } = useGetMyVendorProfile();
  const update = useUpdateVendorProfile();
  const create = useCreateVendorProfile();

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Profile</h1>
          <p className="text-muted-foreground mt-1">
            {p ? (
              <Badge variant={p.status === "approved" ? "secondary" : "outline"} className="capitalize">
                {p.status?.replace(/_/g, " ")}
              </Badge>
            ) : "Create your vendor profile to start receiving quote requests"}
          </p>
        </div>
      </div>

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

      <Button
        size="lg"
        className="w-full font-semibold gap-2"
        onClick={handleSave}
        disabled={saving || !form.businessName.trim()}
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : saved ? "Saved!" : p ? "Save Changes" : "Create Profile"}
      </Button>
    </div>
  );
}
