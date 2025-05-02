import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { MobileCheck } from "@/components/MobileCheck";
import { LoadingScreen } from "@/components/LoadingScreen";
import SplashScreen from "@/components/SplashScreen";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { MatchProvider } from "@/contexts/MatchContext";
import { initTelegramButtonFix } from "./utils/telegram-button-fix";
import { useTelegramInit } from "@/hooks/useTelegramInit";
import AuthTest from "@/components/AuthTest";

// Import RouteComponentProps type for proper router component typing
import type { RouteComponentProps } from "wouter";

// Lazy load all page components
const Dashboard = lazy(() => import("@/pages/dashboard"));
const DiscoverPage = lazy(() => import("@/pages/DiscoverPageNew"));
const MatchesPage = lazy(() => import("@/pages/MatchesPage"));
const AuthTestPage = lazy(() => import("@/pages/auth-test"));
const Welcome = lazy(() => import("@/pages/welcome"));
const PersonalInfo = lazy(() => import("@/pages/personal-info"));
const CompanyBasics = lazy(() => import("@/pages/company-basics"));
const CompanySector = lazy(() => import("@/pages/company-sector"));
const CompanyDetails = lazy(() => import("@/pages/company-details"));
const CompanyInfo = lazy(() => import("@/pages/company-info"));
const ApplicationStatus = lazy(() => import("@/pages/application-status"));

const MarketingCollabsNew = lazy(() => import("@/pages/marketing-collabs-new"));
const DiscoveryFilters = lazy(() => import("@/pages/discovery-filters"));
// Conference coffee feature removed
const ProfileOverview = lazy(() => import("@/pages/profile-overview"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const CreateCollaborationFixed = lazy(() => import("@/pages/create-collaboration-fixed"));
const CreateCollaborationSteps = lazy(() => import("@/pages/create-collaboration-steps"));
const CreateCollaborationV2 = lazy(() => import("@/pages/create-collaboration-v2"));
const EditCollaborationSteps = lazy(() => import("@/pages/edit-collaboration-steps"));
const CreateCollaborationComponent = lazy(() => import("@/pages/create-collaboration"));
// Use optimized version that doesn't have a loading screen
const MyCollaborationsComponent = lazy(() => import("@/pages/my-collaborations"));
const ApplyComponent = lazy(() => import("@/pages/apply"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AdminApplications = lazy(() => import("@/pages/admin/applications"));
const AdminReferralsPage = lazy(() => import("@/pages/admin/referrals"));
const ReferralsPage = lazy(() => import("@/pages/referrals"));

// Lazy load filter sub-pages
const FiltersDashboard = lazy(() => import("@/pages/filters/dashboard"));
const CollabTypesFilter = lazy(() => import("@/pages/filters/collab-types"));
const TopicsFilter = lazy(() => import("@/pages/filters/topics"));
const CompanySectorsFilter = lazy(() => import("@/pages/filters/company-sectors"));
const CompanyFollowersFilter = lazy(() => import("@/pages/filters/company-followers"));
const UserFollowersFilter = lazy(() => import("@/pages/filters/user-followers"));
const FundingStagesFilter = lazy(() => import("@/pages/filters/funding-stages"));
const TokenStatusFilter = lazy(() => import("@/pages/filters/token-status"));
const BlockchainNetworksFilter = lazy(() => import("@/pages/filters/blockchain-networks"));

// Create wrapper components for components with custom props
// These wrapper components convert RouteComponentProps to the specific props each component needs
const MyCollaborations = (props: RouteComponentProps) => <MyCollaborationsComponent />;
const CreateCollaboration = (props: RouteComponentProps) => <CreateCollaborationComponent />;


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
        <Suspense fallback={<LoadingScreen />}>
          <Switch>
            {/* Welcome and Application Flow */}
            <Route path="/welcome" component={Welcome} />
            <Route path="/personal-info" component={PersonalInfo} />
            <Route path="/company-basics" component={CompanyBasics} />
            <Route path="/company-sector" component={CompanySector} />
            <Route path="/company-details" component={CompanyDetails} />
            <Route path="/application-status" component={ApplicationStatus} />

            <Route path="/apply/:id">
              {(params) => <Suspense fallback={<LoadingScreen />}>
                <ApplyComponent id={params.id} />
              </Suspense>}
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
            <Route path="/admin/referrals" component={AdminReferralsPage} />

            {/* Collaboration Routes */}
            <Route path="/create-collaboration-steps">
              {() => <Suspense fallback={<LoadingScreen />}>
                <CreateCollaborationSteps />
              </Suspense>}
            </Route>
            <Route path="/create-collaboration-v2">
              {() => <Suspense fallback={<LoadingScreen />}>
                <CreateCollaborationV2 />
              </Suspense>}
            </Route>
            <Route path="/create-collaboration">
              {() => <Suspense fallback={<LoadingScreen />}>
                <CreateCollaborationComponent />
              </Suspense>}
            </Route>
            
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
        </Suspense>
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
  // Two-phase loading state
  const [appPhase, setAppPhase] = useState<'splash' | 'loading' | 'ready'>('splash');
  
  // Use the optimized Telegram WebApp initialization hook
  const telegramInitialized = useTelegramInit();
  
  // Immediately render the splash screen and transition to loading phase
  useEffect(() => {
    // This first phase transition happens extremely quickly (within ~50ms)
    // just enough time to ensure the splash screen rendered
    const splashTimer = setTimeout(() => {
      setAppPhase('loading');
      
      // Begin actual app initialization in the background
      console.log('[App] Initializing app with ultra-light splash screen');
      
      // Telegram initialization now handled by useTelegramInit hook
      if (!telegramInitialized) {
        console.warn('[App] Telegram WebApp initialization pending...');
      }
    }, 50); // Ultra short timeout to ensure splash screen renders first
    
    return () => clearTimeout(splashTimer);
  }, [telegramInitialized]);
  
  // Once the loading phase starts, begin more intensive initialization
  useEffect(() => {
    if (appPhase !== 'loading') return;
    
    // Initialize Telegram button visibility fix
    const cleanupButtonFix = initTelegramButtonFix();
    applyButtonFix();
    
    // Transition to the fully loaded app after initialization
    const loadingTimer = setTimeout(() => {
      setAppPhase('ready');
    }, 800); // Adjust this time as needed for good UX
    
    return () => {
      clearTimeout(loadingTimer);
      if (typeof cleanupButtonFix === 'function') {
        cleanupButtonFix();
      }
    };
  }, [appPhase]);
  
  // Render different UI based on the loading phase
  return (
    <QueryClientProvider client={queryClient}>
      <MatchProvider>
        {appPhase === 'splash' ? (
          // Phase 1: Ultra-light splash screen (renders in <100ms)
          <SplashScreen />
        ) : appPhase === 'loading' ? (
          // Phase 2: Full loading screen with progress indicator
          <LoadingScreen />
        ) : (
          // Phase 3: Main application
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