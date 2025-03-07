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
import ApplicationStatus from "@/pages/application-status";
import MarketingCollabs from "@/pages/marketing-collabs";
import ConferenceCoffees from "@/pages/conference-coffees";
import ProfileOverview from "@/pages/profile-overview";
import NotFound from "@/pages/not-found";
import { MobileCheck } from "@/components/MobileCheck";
import { useQuery } from "@tanstack/react-query";
import type { ProfileData } from "@/types/profile";
import { Loader2 } from "lucide-react";

function Router() {
  const [_, setLocation] = useLocation();
  // Add profile data check
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    retry: false // Don't retry on 404
  });

  const currentPath = window.location.pathname;

  const isApplicationRoute = currentPath === '/apply' || 
    currentPath === '/personal-info' || 
    currentPath === '/company-basics' ||
    currentPath === '/company-sector' ||
    currentPath === '/company-details';

  const isProfileRoute = currentPath === '/profile-overview' ||
    currentPath === '/marketing-collabs' ||
    currentPath === '/conference-coffees' ||
    currentPath === '/application-status';

  // Show loading state while checking profile
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect if user has already applied
  if (profileData?.user && isApplicationRoute && currentPath !== '/application-status') {
    setLocation('/application-status');
    return null;
  }

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

          {/* Application Flow */}
          <Route path="/apply" component={Welcome} />
          <Route path="/personal-info" component={PersonalInfo} />
          <Route path="/company-basics" component={CompanyBasics} />
          <Route path="/company-sector" component={CompanySector} />
          <Route path="/company-details" component={CompanyDetails} />
          <Route path="/application-status" component={ApplicationStatus} />

          {/* Profile Routes */}
          <Route path="/profile-overview" component={ProfileOverview} />
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