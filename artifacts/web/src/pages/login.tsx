import { useAuth, Role } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";
import { Building2, User, ShieldCheck } from "lucide-react";

export default function Login() {
  const { setRole } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<Role>("planner");

  const handleLogin = () => {
    if (selectedRole) {
      setRole(selectedRole);
      if (selectedRole === "planner") setLocation("/dashboard");
      if (selectedRole === "vendor") setLocation("/vendor/dashboard");
      if (selectedRole === "admin") setLocation("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center pb-8 border-b border-border/10">
          <CardTitle className="text-3xl font-bold text-primary tracking-tight mb-2">Nairobi Events</CardTitle>
          <CardDescription className="text-base">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-muted-foreground uppercase tracking-wider mb-4 block">Select Role</Label>
              <RadioGroup 
                value={selectedRole || ""} 
                onValueChange={(val) => setSelectedRole(val as Role)}
                className="grid gap-4"
              >
                <Label
                  htmlFor="role-planner"
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRole === "planner" 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${selectedRole === "planner" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Event Planner</div>
                      <div className="text-sm text-muted-foreground font-normal">Browse vendors & request quotes</div>
                    </div>
                  </div>
                  <RadioGroupItem value="planner" id="role-planner" className="sr-only" />
                </Label>

                <Label
                  htmlFor="role-vendor"
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRole === "vendor" 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${selectedRole === "vendor" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Vendor</div>
                      <div className="text-sm text-muted-foreground font-normal">Manage profile & respond to requests</div>
                    </div>
                  </div>
                  <RadioGroupItem value="vendor" id="role-vendor" className="sr-only" />
                </Label>

                <Label
                  htmlFor="role-admin"
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRole === "admin" 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${selectedRole === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Admin</div>
                      <div className="text-sm text-muted-foreground font-normal">Manage platform & users</div>
                    </div>
                  </div>
                  <RadioGroupItem value="admin" id="role-admin" className="sr-only" />
                </Label>
              </RadioGroup>
            </div>
            
            <Button onClick={handleLogin} className="w-full h-12 text-base font-semibold shadow-sm" size="lg">
              Continue to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
