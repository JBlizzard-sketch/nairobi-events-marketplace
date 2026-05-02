import { useState, useEffect } from "react";
import { useAdminGetSettings, useAdminUpdateSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SlidersHorizontal,
  Percent,
  WrenchIcon,
  CheckCircle,
  AlertTriangle,
  Save,
} from "lucide-react";

export default function AdminSettings() {
  const { data: settings, isLoading, refetch } = useAdminGetSettings();
  const updateSettings = useAdminUpdateSettings();

  const [feePercent, setFeePercent] = useState<string>("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (settings) {
      setFeePercent(String(settings.platformFeePercent ?? 10));
      setMaintenanceMode(settings.maintenanceMode ?? false);
      setMaintenanceMessage(settings.maintenanceMessage ?? "");
    }
  }, [settings]);

  const handleSave = async () => {
    const parsed = parseFloat(feePercent);
    if (isNaN(parsed) || parsed < 0 || parsed > 50) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }
    setSaveStatus("saving");
    try {
      await updateSettings.mutateAsync({
        data: {
          platformFeePercent: parsed,
          maintenanceMode,
          maintenanceMessage,
        },
      });
      await refetch();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage platform-wide configuration and operational settings.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saveStatus === "saving" ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {saveStatus === "saved" && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully.
          </AlertDescription>
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to save settings. Check values and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Billing Settings */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Percent className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-base">Billing & Fees</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Configure platform commission charged on each completed booking.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="fee-percent" className="font-medium">
                Platform Fee (%)
              </Label>
              <p className="text-xs text-muted-foreground">
                Percentage deducted from each booking total as platform revenue. Must be between 0 and 50.
              </p>
            </div>
            <div className="w-28">
              <div className="relative">
                <Input
                  id="fee-percent"
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={feePercent}
                  onChange={e => setFeePercent(e.target.value)}
                  className="pr-8 text-right font-mono"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Current fee breakdown example</p>
            <div className="flex justify-between">
              <span>Booking total</span>
              <span className="font-mono">KES 100,000</span>
            </div>
            <div className="flex justify-between text-purple-700 dark:text-purple-400">
              <span>Platform fee ({feePercent || 0}%)</span>
              <span className="font-mono">
                KES {(parseFloat(feePercent || "0") * 1000).toLocaleString("en-KE")}
              </span>
            </div>
            <div className="flex justify-between font-medium text-foreground border-t border-border pt-1">
              <span>Vendor receives</span>
              <span className="font-mono">
                KES {(100000 - parseFloat(feePercent || "0") * 1000).toLocaleString("en-KE")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${maintenanceMode ? "bg-amber-100 dark:bg-amber-950" : "bg-muted"}`}>
              <WrenchIcon className={`h-4 w-4 ${maintenanceMode ? "text-amber-600" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Maintenance Mode</CardTitle>
                {maintenanceMode && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-0.5">
                When enabled, a notice is shown to users and new actions may be restricted.
              </CardDescription>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="maintenance-msg" className="font-medium">
              Maintenance Message
            </Label>
            <p className="text-xs text-gray-500">
              This message will be displayed to users while the platform is in maintenance mode.
            </p>
            <Textarea
              id="maintenance-msg"
              rows={3}
              value={maintenanceMessage}
              onChange={e => setMaintenanceMessage(e.target.value)}
              placeholder="Describe what maintenance is occurring…"
              className="resize-none"
            />
          </div>
          {maintenanceMode && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-xs">
                Maintenance mode is currently <strong>active</strong>. Users will see your maintenance message.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
        <SlidersHorizontal className="h-3 w-3" />
        Last updated:{" "}
        {settings?.updatedAt
          ? new Date(settings.updatedAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
          : "—"}
      </div>
    </div>
  );
}
