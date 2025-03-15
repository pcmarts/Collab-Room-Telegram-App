import { useState, useEffect } from "react";
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/layout/BottomNav";
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
import Discover from "@/pages/discover";
import ConferenceCoffees from "@/pages/conference-coffees";
import ProfileOverview from "@/pages/profile-overview";
import MyMatches from "@/pages/my-matches";

// Admin Pages
import AdminUsers from "@/pages/admin/users";
import Apply from "@/pages/apply";
import NotFound from "@/pages/not-found";
import { MobileCheck } from "@/components/MobileCheck";
import { LoadingScreen } from "@/components/LoadingScreen";

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

function Layout({ children, hideNav = false }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background w-full pb-16">
      <div className="w-full px-4 py-2">
        {children}
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Welcome and Application Flow */}
      <Route path="/welcome">
        <Layout hideNav>
          <Welcome />
        </Layout>
      </Route>
      <Route path="/personal-info">
        <Layout hideNav>
          <PersonalInfo />
        </Layout>
      </Route>
      <Route path="/company-basics">
        <Layout hideNav>
          <CompanyBasics />
        </Layout>
      </Route>
      <Route path="/company-sector">
        <Layout hideNav>
          <CompanySector />
        </Layout>
      </Route>
      <Route path="/company-details">
        <Layout hideNav>
          <CompanyDetails />
        </Layout>
      </Route>
      <Route path="/application-status">
        <Layout hideNav>
          <ApplicationStatus />
        </Layout>
      </Route>
      <Route path="/application-form">
        <Layout hideNav>
          <ApplicationForm />
        </Layout>
      </Route>
      <Route path="/apply">
        <Layout hideNav>
          <Apply />
        </Layout>
      </Route>

      {/* Main App Routes - require authentication */}
      <Route path="/">
        <Redirect to="/welcome" />
      </Route>

      {/* Bottom Nav Routes */}
      <Route path="/discover">
        <Layout>
          <Discover />
        </Layout>
      </Route>
      <Route path="/my-matches">
        <Layout>
          <MyMatches />
        </Layout>
      </Route>
      <Route path="/dashboard">
        <Layout>
          <Dashboard />
        </Layout>
      </Route>

      {/* Other Routes */}
      <Route path="/conference-coffees">
        <Layout>
          <ConferenceCoffees />
        </Layout>
      </Route>

      {/* Profile Routes */}
      <Route path="/profile-overview">
        <Layout>
          <ProfileOverview />
        </Layout>
      </Route>
      <Route path="/company-info">
        <Layout>
          <CompanyInfo />
        </Layout>
      </Route>

      <Route path="/not-found">
        <Layout>
          <NotFound />
        </Layout>
      </Route>
      <Route>
        <Layout>
          <NotFound />
        </Layout>
      </Route>
    </Switch>
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
            if (!response.ok) {
              // If profile not found, don't throw error - user might be new
              if (response.status === 404) {
                return null;
              }
              throw new Error('Failed to load profile');
            }
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