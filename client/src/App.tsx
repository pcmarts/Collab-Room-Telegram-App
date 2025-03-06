import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/dashboard";
import Collaborations from "@/pages/collaborations";
import OnboardingForm from "@/pages/onboarding";
import CompanyInfoForm from "@/pages/company-info";
import CollabPreferencesForm from "@/pages/collab-preferences";
import MyCollabsForm from "@/pages/my-collabs";
import ApplicationStatus from "@/pages/application-status";
import ProfileOverview from "@/pages/profile-overview";
import NotFound from "@/pages/not-found";
import { MobileCheck } from "@/components/MobileCheck";

function Router() {
  const isOnboardingRoute = window.location.pathname === '/onboarding' || 
    window.location.pathname === '/company-info' || 
    window.location.pathname === '/collab-preferences';
  const isProfileRoute = window.location.pathname === '/profile-overview' ||
    window.location.pathname === '/my-collabs' ||
    window.location.pathname === '/application-status';

  return (
    <div className="min-h-screen bg-background">
      {!isOnboardingRoute && !isProfileRoute && <Sidebar />}
      <div className={!isOnboardingRoute && !isProfileRoute ? 'lg:pl-64' : ''}>
        <Switch>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/collaborations" component={Collaborations} />
          <Route path="/onboarding" component={OnboardingForm} />
          <Route path="/company-info" component={CompanyInfoForm} />
          <Route path="/collab-preferences" component={CollabPreferencesForm} />
          <Route path="/my-collabs" component={MyCollabsForm} />
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