import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const { role } = useAuth();
  const dashboardHref = role === "vendor" ? "/vendor/dashboard" : role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="text-8xl font-black text-primary/20 leading-none select-none">404</div>
          <div className="w-16 h-1 bg-primary/30 rounded-full mx-auto mt-4" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={dashboardHref}>
            <Button className="gap-2 font-semibold w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-black text-xs">N</div>
            <span className="text-sm font-medium text-muted-foreground">Nairobi Events Marketplace</span>
          </div>
        </div>
      </div>
    </div>
  );
}
