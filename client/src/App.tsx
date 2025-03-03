import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/dashboard";
import Companies from "@/pages/companies";
import Collaborations from "@/pages/collaborations";
import OnboardingForm from "@/pages/onboarding";
import ProfileOverview from "@/pages/profile-overview";
import NotFound from "@/pages/not-found";

function Router() {
  const isOnboardingRoute = window.location.pathname === '/onboarding';
  const isProfileRoute = window.location.pathname === '/profile-overview';

  return (
    <div className="min-h-screen bg-background">
      {/* Only show sidebar on main app pages */}
      {!isOnboardingRoute && !isProfileRoute && <Sidebar />}
      <div className={!isOnboardingRoute && !isProfileRoute ? 'lg:pl-64' : ''}>
        <Switch>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/companies" component={Companies} />
          <Route path="/collaborations" component={Collaborations} />
          <Route path="/onboarding">
            {() => <OnboardingForm isEditMode={window.location.search.includes('edit=true')} />}
          </Route>
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
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;