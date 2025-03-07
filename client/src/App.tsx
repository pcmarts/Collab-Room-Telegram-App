import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/dashboard";
import Collaborations from "@/pages/collaborations";
import Welcome from "@/pages/welcome";
import PersonalInfo from "@/pages/personal-info";
import CompanyBasics from "@/pages/company-basics";
import CompanySector from "@/pages/company-sector";
import CompanyDetails from "@/pages/company-details";
import CompanyInfo from "@/pages/company-info";
import ApplicationStatus from "@/pages/application-status";
import MarketingCollabs from "@/pages/marketing-collabs";
import ConferenceCoffees from "@/pages/conference-coffees";
import ProfileOverview from "@/pages/profile-overview";
import MatchingFilters from "@/pages/matching-filters";
import BrowseCollaborations from "@/pages/browse-collaborations";
import CreateCollaboration from "@/pages/create-collaboration";
import MyCollaborations from "@/pages/my-collaborations";
import Apply from "@/pages/apply";
import NotFound from "@/pages/not-found";
import { MobileCheck } from "@/components/MobileCheck";

function Router() {
  const currentPath = window.location.pathname;

  const isApplicationRoute = currentPath === '/welcome' || 
    currentPath === '/personal-info' || 
    currentPath === '/company-basics' ||
    currentPath === '/company-sector' ||
    currentPath === '/company-details';

  const isProfileRoute = currentPath === '/profile-overview' ||
    currentPath === '/marketing-collabs' ||
    currentPath === '/conference-coffees' ||
    currentPath === '/application-status' ||
    currentPath === '/company-info' ||
    currentPath === '/matching-filters';
    
  const isCollabFlow = currentPath.startsWith('/apply/') ||
    currentPath === '/create-collaboration' ||
    currentPath === '/browse-collaborations' ||
    currentPath === '/my-collaborations';

  return (
    <div className="min-h-screen bg-background">
      {!isApplicationRoute && !isProfileRoute && !isCollabFlow && <Sidebar />}
      <div className={!isApplicationRoute && !isProfileRoute && !isCollabFlow ? 'lg:pl-64' : ''}>
        <Switch>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/collaborations" component={Collaborations} />
          <Route path="/marketing-collabs" component={MarketingCollabs} />
          <Route path="/conference-coffees" component={ConferenceCoffees} />

          {/* Application Flow */}
          <Route path="/welcome" component={Welcome} />
          <Route path="/personal-info" component={PersonalInfo} />
          <Route path="/company-basics" component={CompanyBasics} />
          <Route path="/company-sector" component={CompanySector} />
          <Route path="/company-details" component={CompanyDetails} />
          <Route path="/application-status" component={ApplicationStatus} />

          {/* Collaboration Routes */}
          <Route path="/browse-collaborations" component={BrowseCollaborations} />
          <Route path="/create-collaboration" component={CreateCollaboration} />
          <Route path="/my-collaborations" component={MyCollaborations} />
          <Route path="/apply/:id">
            {(params) => <Apply id={params.id} />}
          </Route>

          {/* Profile Routes */}
          <Route path="/profile-overview" component={ProfileOverview} />
          <Route path="/company-info" component={CompanyInfo} />
          <Route path="/matching-filters" component={MatchingFilters} />
          <Route path="/not-found" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MobileCheck>
        <Router />
      </MobileCheck>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;