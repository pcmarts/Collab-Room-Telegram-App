import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import Dashboard from "@/pages/dashboard";
import DiscoverPage from "@/pages/DiscoverPage";
import MatchesPage from "@/pages/MatchesPage";
import Welcome from "@/pages/welcome";
import PersonalInfo from "@/pages/personal-info";
import CompanyBasics from "@/pages/company-basics";
import CompanySector from "@/pages/company-sector";
import CompanyDetails from "@/pages/company-details";
import CompanyInfo from "@/pages/company-info";
import ApplicationStatus from "@/pages/application-status";
import ApplicationForm from "@/pages/application-form";
import MarketingCollabsNew from "@/pages/marketing-collabs-new";
import ConferenceCoffees from "@/pages/conference-coffees";
import ProfileOverview from "@/pages/profile-overview";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import CreateCollaborationFixed from "@/pages/create-collaboration-fixed";
import CreateCollaborationSteps from "@/pages/create-collaboration-steps";
import EditCollaborationSteps from "@/pages/edit-collaboration-steps";
import CreateCollaboration from "@/pages/create-collaboration";
import MyCollaborations from "@/pages/my-collaborations";
import Apply from "@/pages/apply";
import NotFound from "@/pages/not-found";
import { MobileCheck } from "@/components/MobileCheck";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import AdminApplications from "@/pages/admin/applications";

// Application form routes that should not show bottom navigation
const APPLICATION_ROUTES = [
  '/welcome',
  '/personal-info',
  '/company-basics',
  '/company-sector',
  '/company-details',
  '/application-status',
  '/application-form'
];

function Router() {
  const [location] = useLocation();
  const showBottomNav = !APPLICATION_ROUTES.includes(location);

  return (
    <div className="min-h-screen bg-background w-full">
      <ImpersonationBanner />
      <div className={`w-full px-4 py-2 ${showBottomNav ? 'pb-20' : ''}`}>
        <Switch>
          {/* Welcome and Application Flow */}
          <Route path="/welcome" component={Welcome} />
          <Route path="/personal-info" component={PersonalInfo} />
          <Route path="/company-basics" component={CompanyBasics} />
          <Route path="/company-sector" component={CompanySector} />
          <Route path="/company-details" component={CompanyDetails} />
          <Route path="/application-status" component={ApplicationStatus} />
          <Route path="/application-form" component={ApplicationForm} />
          <Route path="/apply/:id">
            {(params) => <Apply id={params.id} />}
          </Route>

          {/* Main App Routes */}
          <Route path="/">
            <Redirect to="/discover" />
          </Route>

          {/* New Tab Routes */}
          <Route path="/discover" component={DiscoverPage} />
          <Route path="/matches" component={MatchesPage} />
          <Route path="/settings">
            <Redirect to="/dashboard" />
          </Route>

          {/* Existing Routes */}
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/marketing-collabs-new" component={MarketingCollabsNew} />
          <Route path="/conference-coffees" component={ConferenceCoffees} />

          {/* Admin Routes */}
          <Route path="/admin">
            <Redirect to="/admin/dashboard" />
          </Route>
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/applications" component={AdminApplications} />

          {/* Profile Routes */}
          <Route path="/profile-overview" component={ProfileOverview} />
          <Route path="/company-info" component={CompanyInfo} />

          <Route path="/not-found" component={NotFound} />
          <Route path="*" component={NotFound} />
        </Switch>
        {showBottomNav && <BottomNavigation />}
      </div>
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      // Tell Telegram web app that we're ready
      window.Telegram.WebApp.ready();

      // Expand to full screen
      window.Telegram.WebApp.expand();
    }

    // Prefetch critical data
    const prefetchData = async () => {
      try {
        // Prefetch profile data
        await queryClient.prefetchQuery({
          queryKey: ['/api/profile'],
          queryFn: async () => {
            const response = await fetch('/api/profile');
            if (!response.ok) {
              // If profile not found, don't throw error - user might be new
              if (response.status === 404) {
                return null;
              }
              throw new Error('Failed to load profile');
            }
            return response.json();
          }
        });

        // Allow minimum time for loading screen visibility
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mark loading as complete
        setIsLoading(false);
      } catch (error) {
        console.error('Error prefetching data:', error);
        // Even if prefetching fails, we should still show the app
        setIsLoading(false);
      }
    };

    prefetchData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <MobileCheck>
          <Router />
        </MobileCheck>
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;