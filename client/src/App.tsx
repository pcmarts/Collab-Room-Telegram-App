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
import { initTelegramButtonFix } from "./utils/telegram-button-fix";
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
import ReferralsPage from "@/pages/referrals";
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
          
          {/* Referral Routes */}
          <Route path="/referrals" component={ReferralsPage} />
          
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

// Global button fix function that can be called from anywhere
export const applyButtonFix = () => {
  // Apply fixes to all buttons with telegram-button class
  const buttons = document.querySelectorAll('.telegram-button');
  const containers = document.querySelectorAll('.telegram-fixed-container');
  
  buttons.forEach(button => {
    if (button instanceof HTMLElement) {
      button.style.setProperty('opacity', '1', 'important');
      button.style.setProperty('visibility', 'visible', 'important');
      button.style.setProperty('display', 'flex', 'important');
      button.style.setProperty('background-color', '#4034B9', 'important');
      button.style.setProperty('color', 'white', 'important');
      button.style.setProperty('border', 'none', 'important');
      button.style.setProperty('height', '48px', 'important');
      button.style.setProperty('min-height', '48px', 'important');
      button.style.setProperty('z-index', '9999', 'important');
      button.style.setProperty('position', 'relative', 'important');
      button.style.setProperty('font-weight', 'bold', 'important');
      button.style.setProperty('font-size', '16px', 'important');
      button.style.setProperty('text-shadow', 'none', 'important');
      button.style.setProperty('filter', 'none', 'important');
      button.style.setProperty('outline', 'none', 'important');
      button.style.setProperty('pointer-events', 'auto', 'important');
      button.style.setProperty('justify-content', 'center', 'important');
      button.style.setProperty('align-items', 'center', 'important');
      button.classList.add('telegram-button-visible');
    }
  });
  
  containers.forEach(container => {
    if (container instanceof HTMLElement) {
      container.style.setProperty('opacity', '1', 'important');
      container.style.setProperty('visibility', 'visible', 'important');
      container.style.setProperty('display', 'block', 'important');
      container.style.setProperty('position', 'fixed', 'important');
      container.style.setProperty('bottom', '0', 'important');
      container.style.setProperty('left', '0', 'important');
      container.style.setProperty('right', '0', 'important');
      container.style.setProperty('width', '100%', 'important');
      container.style.setProperty('padding', '16px', 'important');
      container.style.setProperty('background-color', 'black', 'important');
      container.style.setProperty('border-top', '1px solid rgba(255,255,255,0.1)', 'important');
      container.style.setProperty('z-index', '9999', 'important');
      container.style.setProperty('pointer-events', 'auto', 'important');
      container.classList.add('telegram-container-visible');
    }
  });

  // Also add a class to the body for easier targeting
  document.body.classList.add('telegram-webapp-loaded');
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[App] Initializing app with disabled auto-refresh');
    
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      // Tell Telegram web app that we're ready
      window.Telegram.WebApp.ready();

      // Expand to full screen
      window.Telegram.WebApp.expand();
    }
    
    // Initialize Telegram button visibility fix
    const cleanupButtonFix = initTelegramButtonFix();
    
    // Apply button fix once, but don't set up intervals
    // This prevents constant background activity that could trigger re-renders
    applyButtonFix();
    
    // Disable the interval-based button fix
    // const fixInterval = setInterval(applyButtonFix, 500); // <-- DISABLED

    // Skip prefetching data to prevent authentication prompts
    // This allows the app to start without requiring authentication immediately
    console.log('[App] Auto data prefetching has been disabled to prevent authentication issues');
    
    // Just complete loading after a minimal delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    // Cleanup function for useEffect
    return () => {
      if (typeof cleanupButtonFix === 'function') {
        cleanupButtonFix();
      }
      // clearInterval(fixInterval); // <-- No interval to clear
    };
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