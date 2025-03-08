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
import MarketingCollabs from "@/pages/marketing-collabs";
import ConferenceCoffees from "@/pages/conference-coffees-updated";
import ProfileOverview from "@/pages/profile-overview";
import MatchingFilters from "@/pages/matching-filters";
import BrowseCollaborations from "@/pages/browse-collaborations";
import CreateCollaboration from "@/pages/create-collaboration-fixed";
import MyCollaborations from "@/pages/my-collaborations";
import Apply from "@/pages/apply";
import NotFound from "@/pages/not-found";
import { MobileCheck } from "@/components/MobileCheck";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
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
            {(params: {id: string}) => <Apply id={params.id} />}
          </Route>
          <Route path="/collaboration/:id">
            {(params: {id: string}) => <BrowseCollaborations id={params.id} />}
          </Route>
          <Route path="/edit-collaboration/:id">
            {(params: {id: string}) => <CreateCollaboration id={params.id} />}
          </Route>
          <Route path="/collaboration/:id/applications">
            {(params: {id: string}) => <MyCollaborations collaborationId={params.id} />}
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