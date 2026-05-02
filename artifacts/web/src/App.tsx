import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";

// Pages — shared
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";

// Pages — auth
import RoleSelect from "@/pages/auth/role-select";

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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(35 90% 50%)",
    colorForeground: "hsl(240 10% 15%)",
    colorMutedForeground: "hsl(240 5% 45%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(40 15% 85%)",
    colorInputForeground: "hsl(240 10% 15%)",
    colorNeutral: "hsl(40 10% 90%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-xl w-[440px] max-w-full overflow-hidden shadow-lg border border-amber-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-amber-600 font-medium hover:text-amber-700",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-amber-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-gray-700",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-amber-50",
    formButtonPrimary: "bg-amber-500 hover:bg-amber-600 text-white font-semibold",
    formFieldInput: "border-gray-300 bg-white text-gray-900 focus:border-amber-400 focus:ring-amber-400",
    footerAction: "bg-amber-50/50",
    dividerLine: "bg-gray-200",
    alert: "border border-red-200 bg-red-50",
    otpCodeFieldInput: "border-gray-300 text-gray-900",
    formFieldRow: "gap-3",
    main: "gap-4",
  },
};

// Invalidate TanStack Query cache when the signed-in user changes
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { isSignedIn, isLoaded, role, isNewUser } = useAuth();

  if (!isLoaded) return <Spinner />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (isNewUser) return <Redirect to="/role-select" />;

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === "planner") return <Redirect to="/dashboard" />;
    if (role === "vendor") return <Redirect to="/vendor/dashboard" />;
    if (role === "admin") return <Redirect to="/admin" />;
    return <Redirect to="/" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function RootRedirect() {
  const { isSignedIn, isLoaded, role, isNewUser } = useAuth();
  if (!isLoaded) return <Spinner />;
  if (!isSignedIn) return <Landing />;
  if (isNewUser) return <Redirect to="/role-select" />;
  if (role === "planner") return <Redirect to="/dashboard" />;
  if (role === "vendor") return <Redirect to="/vendor/dashboard" />;
  if (role === "admin") return <Redirect to="/admin" />;
  return <Landing />;
}

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/role-select`}
      />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/role-select" component={RoleSelect} />

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

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to Nairobi Events",
          },
        },
        signUp: {
          start: {
            title: "Join Nairobi Events",
            subtitle: "Connect planners with the best vendors in Nairobi",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
