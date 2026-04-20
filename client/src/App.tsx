import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { MobileCheck } from "@/components/MobileCheck";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { MatchProvider } from "@/contexts/MatchContext";
import { useTelegramInit } from "@/hooks/useTelegramInit";
import { mobileKeyboardManager } from "./utils/mobile-keyboard";
import { initTelegramTheme } from "@/lib/telegramTheme";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const DiscoverPage = lazy(() => import("@/pages/DiscoverPageList"));
const MatchesPage = lazy(() => import("@/pages/MatchesPage"));
const AuthTestPage = lazy(() => import("@/pages/auth-test"));
const Welcome = lazy(() => import("@/pages/welcome"));
const PersonalInfo = lazy(() => import("@/pages/personal-info"));
const CompanyBasics = lazy(() => import("@/pages/company-basics"));
const CompanyInfo = lazy(() => import("@/pages/company-info"));
const ApplicationStatus = lazy(() => import("@/pages/application-status"));
const DiscoveryFilters = lazy(() => import("@/pages/discovery-filters"));
const ProfileOverview = lazy(() => import("@/pages/profile-overview"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const CreateCollaborationV2 = lazy(() => import("@/pages/create-collaboration-v2"));
const MyCollaborations = lazy(() => import("@/pages/my-collaborations"));
const ApplyComponent = lazy(() => import("@/pages/apply"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AdminApplications = lazy(() => import("@/pages/admin/applications"));
const AdminReferralsPage = lazy(() => import("@/pages/admin/referrals"));
const ReferralsPage = lazy(() => import("@/pages/referrals"));
const RequestsPage = lazy(() => import("@/pages/requests"));

const NoLoadingFallback = () => null;

const APPLICATION_ROUTES = [
  "/welcome",
  "/personal-info",
  "/company-basics",
  "/application-status",
  "/company-info",
  "/profile-overview",
  "/discovery-filters",
];

function Router() {
  const [location] = useLocation();
  const showBottomNav = !APPLICATION_ROUTES.includes(location);

  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      <ImpersonationBanner />
      <div
        className="w-full flex-grow overflow-auto"
        style={
          showBottomNav
            ? { paddingBottom: "calc(56px + env(safe-area-inset-bottom, 0px) + 16px)" }
            : undefined
        }
      >
        <Suspense fallback={<NoLoadingFallback />}>
          <Switch>
            <Route path="/welcome" component={Welcome} />
            <Route path="/personal-info" component={PersonalInfo} />
            <Route path="/company-basics" component={CompanyBasics} />
            <Route path="/application-status" component={ApplicationStatus} />
            <Route path="/apply/:id">
              {(params) => <ApplyComponent id={params.id} />}
            </Route>

            <Route path="/">
              <Redirect to="/discover" />
            </Route>

            <Route path="/discover" component={DiscoverPage} />
            <Route path="/my-collaborations" component={MyCollaborations} />
            <Route path="/my-collabs">
              <Redirect to="/my-collaborations" />
            </Route>
            <Route path="/requests" component={RequestsPage} />
            <Route path="/matches" component={MatchesPage} />
            <Route path="/settings">
              <Redirect to="/dashboard" />
            </Route>

            <Route path="/dashboard" component={Dashboard} />
            <Route path="/discovery-filters" component={DiscoveryFilters} />

            <Route path="/admin">
              <Redirect to="/admin/dashboard" />
            </Route>
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route path="/admin/applications" component={AdminApplications} />
            <Route path="/admin/referrals" component={AdminReferralsPage} />

            <Route path="/create-collaboration-v2" component={CreateCollaborationV2} />

            <Route path="/profile-overview" component={ProfileOverview} />
            <Route path="/company-info" component={CompanyInfo} />

            <Route path="/referrals" component={ReferralsPage} />

            <Route path="/auth-test" component={AuthTestPage} />

            <Route path="/not-found" component={NotFound} />
            <Route path="*" component={NotFound} />
          </Switch>
        </Suspense>
        {showBottomNav && <BottomNavigation />}
      </div>
    </div>
  );
}

function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const telegramInitialized = useTelegramInit();

  useEffect(() => {
    const teardown = initTelegramTheme();
    return teardown;
  }, []);

  useEffect(() => {
    if (telegramInitialized) setIsAppReady(true);
  }, [telegramInitialized]);

  useEffect(() => {
    const fallback = setTimeout(() => setIsAppReady(true), 600);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MatchProvider>
        {!isAppReady ? (
          <LoadingScreen />
        ) : (
          <MobileCheck>
            <Router />
          </MobileCheck>
        )}
        <Toaster />
      </MatchProvider>
    </QueryClientProvider>
  );
}

export default App;
