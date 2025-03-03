import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { User as UserIcon, Settings, Users, BookOpen } from 'lucide-react';
import type { User, Company, Preferences } from '@shared/schema';

interface ProfileData {
  user: User;
  company: Company;
  preferences: Preferences;
}

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground">Please complete the onboarding process.</p>
        <Button className="mt-4" onClick={() => setLocation('/onboarding')}>
          Complete Profile
        </Button>
      </div>
    );
  }

  const { user, company, preferences } = profile;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user.first_name}!</h1>
        <p className="text-muted-foreground">Manage your collaborations and profile</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button
          variant="outline"
          className="h-24 flex-col"
          onClick={() => setLocation('/profile-overview')}
        >
          <UserIcon className="h-6 w-6 mb-2" />
          <span>Edit Profile</span>
        </Button>
        <Button
          variant="outline"
          className="h-24 flex-col"
          onClick={() => setLocation('/collab-preferences')}
        >
          <Settings className="h-6 w-6 mb-2" />
          <span>Edit Preferences</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Open Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-2xl font-bold">0</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-sm">
                {company ? 'Complete' : 'Incomplete'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Info Quick View */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Company Profile</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/company-info')}
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Company:</strong> {company?.name}</p>
            <p><strong>Role:</strong> {company?.job_title}</p>
            <p><strong>Website:</strong> {company?.website}</p>
          </div>
        </CardContent>
      </Card>

      {/* Collaboration Preferences Quick View */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Collaboration Preferences</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/collab-preferences')}
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Looking to Discover</h3>
              <div className="flex flex-wrap gap-2">
                {preferences?.collabs_to_discover?.map(collab => (
                  <span key={collab} className="px-2 py-1 bg-primary/10 rounded-full text-xs">
                    {collab}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Ready to Host</h3>
              <div className="flex flex-wrap gap-2">
                {preferences?.collabs_to_host?.map(collab => (
                  <span key={collab} className="px-2 py-1 bg-primary/10 rounded-full text-xs">
                    {collab}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}