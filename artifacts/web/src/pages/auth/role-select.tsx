import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar, Briefcase, ArrowRight, Loader2 } from "lucide-react";

export default function RoleSelect() {
  const { user, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<"planner" | "vendor" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedRole || !user) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || email;
      const avatarUrl = user.imageUrl ?? undefined;

      const res = await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, fullName, role: selectedRole, avatarUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to set up account");
      }

      // Invalidate the /users/me query so useAuth picks up the new DB user
      await queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });

      if (selectedRole === "planner") {
        setLocation("/dashboard");
      } else {
        setLocation("/vendor/dashboard");
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:bg-background flex items-center justify-center p-4">
      <div className="bg-white dark:bg-card rounded-2xl shadow-lg border border-amber-100 dark:border-border w-full max-w-lg p-8">
        {/* Logo + header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500 rounded-xl mb-4">
            <span className="text-white text-2xl font-bold">N</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">How will you use Nairobi Events?</h1>
          <p className="text-gray-500 dark:text-muted-foreground mt-2 text-sm">
            Choose your role — you can always contact us to change it later.
          </p>
        </div>

        {/* Role cards */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setSelectedRole("planner")}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
              selectedRole === "planner"
                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                : "border-gray-200 dark:border-border hover:border-amber-300 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-lg ${selectedRole === "planner" ? "bg-amber-500" : "bg-amber-100 dark:bg-amber-950/40"}`}>
                <Calendar className={`h-5 w-5 ${selectedRole === "planner" ? "text-white" : "text-amber-600"}`} />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-foreground">Event Planner</div>
                <div className="text-sm text-gray-500 dark:text-muted-foreground mt-0.5">
                  Submit event briefs and receive competing quotes from vetted vendors within 4 hours.
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole("vendor")}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
              selectedRole === "vendor"
                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                : "border-gray-200 dark:border-border hover:border-amber-300 hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-lg ${selectedRole === "vendor" ? "bg-amber-500" : "bg-amber-100 dark:bg-amber-950/40"}`}>
                <Briefcase className={`h-5 w-5 ${selectedRole === "vendor" ? "text-white" : "text-amber-600"}`} />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-foreground">Event Vendor</div>
                <div className="text-sm text-gray-500 dark:text-muted-foreground mt-0.5">
                  Get matched with planners looking for your services and grow your events business.
                </div>
              </div>
            </div>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button
          className="w-full h-11 text-base font-semibold bg-amber-500 hover:bg-amber-600 text-white"
          disabled={!selectedRole || isSubmitting}
          onClick={handleContinue}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? "Setting up your account…" : "Continue"}
        </Button>

        <p className="text-center text-xs text-gray-400 dark:text-muted-foreground mt-4">
          Signed in as {user?.primaryEmailAddress?.emailAddress}
        </p>
      </div>
    </div>
  );
}
