import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/dashboard";
import Companies from "@/pages/companies";
import Collaborations from "@/pages/collaborations";
import OnboardingForm from "@/pages/onboarding";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      {/* Only show sidebar on non-onboarding pages */}
      {window.location.pathname !== '/onboarding' && <Sidebar />}
      <div className={window.location.pathname !== '/onboarding' ? 'lg:pl-64' : ''}>
        <Switch>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/companies" component={Companies} />
          <Route path="/collaborations" component={Collaborations} />
          <Route path="/onboarding" component={OnboardingForm} />
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