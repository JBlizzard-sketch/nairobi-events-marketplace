import { useState, useEffect } from "react";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import {
  Save, User, Mail, Phone, ShieldCheck, CheckCircle2,
  Calendar, Building2, Briefcase, Sparkles, Star, LayoutDashboard,
  Users, BookOpen, ChevronRight, AlertTriangle,
} from "lucide-react";
import { useDocumentTitle } from "@/hooks/use-document-title";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  planner: { label: "Event Planner", color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50" },
  vendor: { label: "Vendor", color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50" },
  admin: { label: "Administrator", color: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/50" },
};

const PORTAL_LINKS: Record<string, Array<{ href: string; icon: any; label: string; desc: string }>> = {
  planner: [
    { href: "/events", icon: Calendar, label: "My Events", desc: "View and manage your event briefs" },
    { href: "/vendors", icon: Building2, label: "Vendor Directory", desc: "Browse and compare vetted vendors" },
    { href: "/bookings", icon: Briefcase, label: "My Bookings", desc: "Track confirmed bookings" },
    { href: "/budget", icon: Sparkles, label: "Budget AI", desc: "Optimise your event budget" },
  ],
  vendor: [
    { href: "/vendor/profile", icon: Building2, label: "My Profile", desc: "Update your vendor profile" },
    { href: "/vendor/requests", icon: BookOpen, label: "Quote Requests", desc: "Browse and respond to requests" },
    { href: "/vendor/bookings", icon: Briefcase, label: "My Bookings", desc: "Manage confirmed bookings" },
    { href: "/vendor/reviews", icon: Star, label: "My Reviews", desc: "See ratings from planners" },
  ],
  admin: [
    { href: "/admin", icon: LayoutDashboard, label: "Platform Overview", desc: "Marketplace statistics" },
    { href: "/admin/vendors", icon: Building2, label: "Vendors", desc: "Approve and manage vendors" },
    { href: "/admin/users", icon: Users, label: "Users", desc: "View all platform users" },
    { href: "/admin/bookings", icon: Briefcase, label: "Bookings", desc: "Monitor all bookings" },
  ],
};

export default function AccountSettings() {
  const { data: userRaw, isLoading, refetch, isError: userError } = useGetMe();
  useDocumentTitle("Account Settings");
  const updateMe = useUpdateMe();
  const user = userRaw as any;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const isDirty =
    (user?.fullName ?? "") !== fullName ||
    (user?.phone ?? "") !== phone;

  const handleSave = async () => {
    setStatus("saving");
    try {
      await updateMe.mutateAsync({
        data: {
          fullName: fullName.trim() || undefined,
          phone: phone.trim() || undefined,
        },
      });
      await refetch();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const roleInfo = ROLE_LABELS[user?.role] ?? { label: user?.role ?? "Unknown", color: "bg-muted text-muted-foreground" };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and contact details</p>
      </div>

      {userError && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Failed to load account data — please refresh the page.</span>
        </div>
      )}

      {/* Account overview */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-base">Account Overview</CardTitle>
          <CardDescription>Your Nairobi Events Marketplace account</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <div className="bg-primary/10 p-2.5 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Display name</p>
                  <p className="font-medium truncate">{user?.fullName ?? "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <div className="bg-primary/10 p-2.5 rounded-full">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Email address</p>
                  <p className="font-medium truncate">{user?.email ?? "—"}</p>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  Managed by Clerk
                </Badge>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <div className="bg-primary/10 p-2.5 rounded-full">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Account role</p>
                  <Badge className={`mt-0.5 text-xs border ${roleInfo.color}`}>{roleInfo.label}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <div className="bg-primary/10 p-2.5 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Member since</p>
                  <p className="font-medium">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-base">Edit Profile</CardTitle>
          <CardDescription>Update your display name and phone number</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium">
                  Phone Number
                  <span className="text-xs font-normal text-muted-foreground ml-2">Optional</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7XX XXX XXX"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                To change your email address or password, manage your account through Clerk.
              </div>

              {status === "saved" && (
                <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Profile saved successfully.
                  </AlertDescription>
                </Alert>
              )}

              {status === "error" && (
                <Alert variant="destructive">
                  <AlertDescription>Failed to save. Please try again.</AlertDescription>
                </Alert>
              )}

              <Separator />

              <Button
                onClick={handleSave}
                disabled={!isDirty || status === "saving" || !fullName.trim()}
                className="gap-2 font-semibold"
              >
                {status === "saving" ? (
                  "Saving..."
                ) : status === "saved" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Role-specific portal shortcuts */}
      {!isLoading && user?.role && PORTAL_LINKS[user.role] && (
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-base">Your Portal</CardTitle>
            <CardDescription>Quick links to your main workspace</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-1">
            {PORTAL_LINKS[user.role].map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="bg-primary/10 group-hover:bg-primary/15 p-2 rounded-lg flex-shrink-0 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
