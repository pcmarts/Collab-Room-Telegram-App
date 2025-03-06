import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/dashboard";
import Collaborations from "@/pages/collaborations";
import ApplicationForm from "@/pages/application-form";
import MarketingCollabs from "@/pages/marketing-collabs";
import ConferenceCoffees from "@/pages/conference-coffees";
import CompanyInfoForm from "@/pages/company-info";
import ReferralCodeForm from "@/pages/referral-code";
import MatchingFilters from "@/pages/matching-filters";
import ApplicationStatus from "@/pages/application-status";
import ProfileOverview from "@/pages/profile-overview";
import NotFound from "@/pages/not-found";
import { MobileCheck } from "@/components/MobileCheck";

function Router() {
  const isApplicationRoute = window.location.pathname === '/apply' || 
    window.location.pathname === '/company-info' || 
    window.location.pathname === '/referral-code';
  const isProfileRoute = window.location.pathname === '/profile-overview' ||
    window.location.pathname === '/marketing-collabs' ||
    window.location.pathname === '/conference-coffees' ||
    window.location.pathname === '/application-status';

  return (
    <div className="min-h-screen bg-background">
      {!isApplicationRoute && !isProfileRoute && <Sidebar />}
      <div className={!isApplicationRoute && !isProfileRoute ? 'lg:pl-64' : ''}>
        <Switch>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/collaborations" component={Collaborations} />
          <Route path="/marketing-collabs" component={MarketingCollabs} />
          <Route path="/conference-coffees" component={ConferenceCoffees} />
          <Route path="/apply" component={ApplicationForm} />
          <Route path="/company-info" component={CompanyInfoForm} />
          <Route path="/referral-code" component={ReferralCodeForm} />
          <Route path="/matching-filters" component={MatchingFilters} />
          <Route path="/application-status" component={ApplicationStatus} />
          <Route path="/profile-overview" component={ProfileOverview} />
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