import { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import Collaborations from "@/pages/collaborations";
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

// Admin Pages
import AdminUsers from "@/pages/admin/users";

// BrowseCollaborations page removed as requested
import CreateCollaborationFixed from "@/pages/create-collaboration-fixed";
import CreateCollaboration from "@/pages/create-collaboration";
import MyCollaborations from "@/pages/my-collaborations";
import Apply from "@/pages/apply";
import NotFound from "@/pages/not-found";
import { MobileCheck } from "@/components/MobileCheck";
import { LoadingScreen } from "@/components/LoadingScreen";

function Router() {
  return (
    <div className="min-h-screen bg-background w-full">
      <div className="w-full px-4 py-2">
        <Switch>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/collaborations">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/marketing-collabs">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/marketing-collabs-new" component={MarketingCollabsNew} />
          <Route path="/conference-coffees" component={ConferenceCoffees} />

          {/* Application Flow - all redirected to Marketing Collabs */}
          <Route path="/welcome">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/personal-info">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/company-basics">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/company-sector">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/company-details">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/application-status">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/application-form">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/apply">
            <Redirect to="/marketing-collabs-new" />
          </Route>

          {/* All collaboration routes redirected to Marketing Collabs page */}
          <Route path="/browse-collaborations">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/create-collaboration">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/create-collaboration-fixed" component={CreateCollaborationFixed} />
          <Route path="/my-collaborations">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/apply/:id">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/collaboration/:id">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/edit-collaboration/:id">
            {(params) => <CreateCollaborationFixed id={params.id} />}
          </Route>
          <Route path="/collaboration/edit/:id">
            <Redirect to="/marketing-collabs-new" />
          </Route>
          <Route path="/collaboration/:id/applications">
            <Redirect to="/marketing-collabs-new" />
          </Route>

          {/* Profile Routes */}
          <Route path="/profile-overview" component={ProfileOverview} />
          <Route path="/company-info" component={CompanyInfo} />

          {/* Redirects for removed preference pages */}
          <Route path="/collab-preferences">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/matching-filters">
            <Redirect to="/dashboard" />
          </Route>
          
          {/* Admin Routes redirected to Marketing Collabs */}
          <Route path="/admin/users">
            <Redirect to="/marketing-collabs-new" />
          </Route>

          <Route path="/not-found" component={NotFound} />
          <Route path="*" component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prefetch critical data
    const prefetchData = async () => {
      try {
        // Prefetch profile data
        await queryClient.prefetchQuery({
          queryKey: ['/api/profile'],
          queryFn: async () => {
            const response = await fetch('/api/profile');
            if (!response.ok) throw new Error('Failed to load profile');
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