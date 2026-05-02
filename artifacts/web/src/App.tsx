import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";

// Pages — shared
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";

// Pages — planner
import PlannerDashboard from "@/pages/planner/dashboard";
import EventsList from "@/pages/planner/events-list";
import EventNew from "@/pages/planner/event-new";
import EventDetail from "@/pages/planner/event-detail";
import VendorsDirectory from "@/pages/planner/vendors";
import VendorProfile from "@/pages/planner/vendor-profile";
import BookingsList from "@/pages/planner/bookings";
import BookingDetail from "@/pages/planner/booking-detail";
import Notifications from "@/pages/planner/notifications";

// Pages — vendor
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorRequests from "@/pages/vendor/requests";
import VendorProfileEdit from "@/pages/vendor/profile";
import VendorAvailability from "@/pages/vendor/availability";

// Pages — admin
import AdminStats from "@/pages/admin/stats";
import AdminVendors from "@/pages/admin/vendors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { role } = useAuth();

  if (!role) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "planner") return <Redirect to="/dashboard" />;
    if (role === "vendor") return <Redirect to="/vendor/dashboard" />;
    if (role === "admin") return <Redirect to="/admin" />;
    return <Redirect to="/login" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function RootRedirect() {
  const { role } = useAuth();
  if (role === "planner") return <Redirect to="/dashboard" />;
  if (role === "vendor") return <Redirect to="/vendor/dashboard" />;
  if (role === "admin") return <Redirect to="/admin" />;
  return <Landing />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Login} />

      {/* Planner routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={PlannerDashboard} allowedRoles={["planner"]} />
      </Route>
      <Route path="/events/new">
        <ProtectedRoute component={EventNew} allowedRoles={["planner"]} />
      </Route>
      <Route path="/events/:id">
        <ProtectedRoute component={EventDetail} allowedRoles={["planner"]} />
      </Route>
      <Route path="/events">
        <ProtectedRoute component={EventsList} allowedRoles={["planner"]} />
      </Route>
      <Route path="/vendors/:id">
        <ProtectedRoute component={VendorProfile} allowedRoles={["planner"]} />
      </Route>
      <Route path="/vendors">
        <ProtectedRoute component={VendorsDirectory} allowedRoles={["planner"]} />
      </Route>
      <Route path="/bookings/:id">
        <ProtectedRoute component={BookingDetail} allowedRoles={["planner"]} />
      </Route>
      <Route path="/bookings">
        <ProtectedRoute component={BookingsList} allowedRoles={["planner"]} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={Notifications} allowedRoles={["planner"]} />
      </Route>

      {/* Vendor routes */}
      <Route path="/vendor/dashboard">
        <ProtectedRoute component={VendorDashboard} allowedRoles={["vendor"]} />
      </Route>
      <Route path="/vendor/requests">
        <ProtectedRoute component={VendorRequests} allowedRoles={["vendor"]} />
      </Route>
      <Route path="/vendor/profile">
        <ProtectedRoute component={VendorProfileEdit} allowedRoles={["vendor"]} />
      </Route>
      <Route path="/vendor/availability">
        <ProtectedRoute component={VendorAvailability} allowedRoles={["vendor"]} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/vendors">
        <ProtectedRoute component={AdminVendors} allowedRoles={["admin"]} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminStats} allowedRoles={["admin"]} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
