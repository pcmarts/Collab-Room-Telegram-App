import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { MobileCheck } from "@/components/MobileCheck";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { MatchProvider } from "@/contexts/MatchContext";
import AuthTest from "@/components/AuthTest";
import Dashboard from "@/pages/dashboard";
import DiscoverPage from "@/pages/DiscoverPageNew";
import MatchesPage from "@/pages/MatchesPage";
import AuthTestPage from "@/pages/auth-test";
import Welcome from "@/pages/welcome";
import PersonalInfo from "@/pages/personal-info";
import CompanyBasics from "@/pages/company-basics";
import CompanySector from "@/pages/company-sector";
import CompanyDetails from "@/pages/company-details";
import CompanyInfo from "@/pages/company-info";
import ApplicationStatus from "@/pages/application-status";
import ApplicationForm from "@/pages/application-form";
import MarketingCollabsNew from "@/pages/marketing-collabs-new";
import DiscoveryFilters from "@/pages/discovery-filters";
// Conference coffee feature removed
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
import AdminApplications from "@/pages/admin/applications";
// Import filter sub-pages
import FiltersDashboard from "@/pages/filters/dashboard";
import CollabTypesFilter from "@/pages/filters/collab-types";
import TopicsFilter from "@/pages/filters/topics";
import CompanySectorsFilter from "@/pages/filters/company-sectors";
import CompanyFollowersFilter from "@/pages/filters/company-followers";
import UserFollowersFilter from "@/pages/filters/user-followers";
import FundingStagesFilter from "@/pages/filters/funding-stages";
import TokenStatusFilter from "@/pages/filters/token-status";
import BlockchainNetworksFilter from "@/pages/filters/blockchain-networks";


// Application form routes that should not show bottom navigation
const APPLICATION_ROUTES = [
  '/welcome',
  '/personal-info',
  '/company-basics',
  '/company-sector',
  '/company-details',
  '/application-status',
  '/application-form',
  '/company-info',
  '/profile-overview',
  '/discovery-filters',
  '/filters',
  '/filters/collab-types',
  '/filters/topics',
  '/filters/company-sectors',
  '/filters/company-followers',
  '/filters/user-followers',
  '/filters/funding-stages',
  '/filters/token-status',
  '/filters/blockchain-networks'
];

function Router() {
  const [location] = useLocation();
  const showBottomNav = !APPLICATION_ROUTES.includes(location);

  return (
    <div className="min-h-screen bg-background w-full">
      <ImpersonationBanner />
      <div className={`w-full ${showBottomNav ? 'pb-24' : ''}`}>
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
          <Route path="/my-collaborations" component={MyCollaborations} />
          <Route path="/matches" component={MatchesPage} />
          <Route path="/settings">
            <Redirect to="/dashboard" />
          </Route>

          {/* Existing Routes */}
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/discovery-filters" component={DiscoveryFilters} />
          <Route path="/marketing-collabs-new" component={MarketingCollabsNew} />
          
          {/* Filter Routes (New) */}
          <Route path="/filters" component={FiltersDashboard} />
          <Route path="/filters/collab-types" component={CollabTypesFilter} />
          <Route path="/filters/topics" component={TopicsFilter} />
          <Route path="/filters/company-sectors" component={CompanySectorsFilter} />
          <Route path="/filters/company-followers" component={CompanyFollowersFilter} />
          <Route path="/filters/user-followers" component={UserFollowersFilter} />
          <Route path="/filters/funding-stages" component={FundingStagesFilter} />
          <Route path="/filters/token-status" component={TokenStatusFilter} />
          <Route path="/filters/blockchain-networks" component={BlockchainNetworksFilter} />
          
          {/* Conference coffee route removed 
          <Route path="/conference-coffees" component={null} /> 
          */}

          {/* Admin Routes */}
          <Route path="/admin">
            <Redirect to="/admin/dashboard" />
          </Route>
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/applications" component={AdminApplications} />

          {/* Collaboration Routes */}
          <Route path="/create-collaboration-steps" component={CreateCollaborationSteps} />
          <Route path="/create-collaboration" component={CreateCollaboration} />
          
          {/* Profile Routes */}
          <Route path="/profile-overview" component={ProfileOverview} />
          <Route path="/company-info" component={CompanyInfo} />
          
          {/* Testing Routes */}
          <Route path="/auth-test" component={AuthTestPage} />

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
          // Let the default queryFn from the query client handle this
          // which will automatically include the Telegram headers
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
      <MatchProvider>
        {isLoading ? (
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