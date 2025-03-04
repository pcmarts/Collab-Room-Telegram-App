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
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center min-h-[100svh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground mb-4">Please complete the onboarding process.</p>
        <Button className="w-full max-w-xs" onClick={() => setLocation('/onboarding')}>
          Complete Profile
        </Button>
      </div>
    );
  }

  const { user, company, preferences } = profile;

  // Close Telegram WebApp loading when dashboard is ready
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
  }

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Welcome Section */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
        <h1 className="text-xl font-semibold">Welcome, {user.first_name}!</h1>
        <p className="text-sm text-muted-foreground">Manage your collaborations and profile</p>
      </div>

      <div className="p-4 space-y-4 pb-safe">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setLocation('/profile-overview')}
          >
            <UserIcon className="h-5 w-5 mb-1.5" />
            <span className="text-sm">Edit Profile</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setLocation('/preferences')}
          >
            <Settings className="h-5 w-5 mb-1.5" />
            <span className="text-sm">Preferences</span>
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <Users className="h-5 w-5 mb-1.5 text-primary" />
                <span className="text-xl font-bold">0</span>
                <span className="text-xs text-muted-foreground">Active Collabs</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col items-center">
                <BookOpen className="h-5 w-5 mb-1.5 text-primary" />
                <span className="text-xl font-bold">0</span>
                <span className="text-xs text-muted-foreground">Opportunities</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Info Quick View */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Company Profile</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3"
                onClick={() => setLocation('/company-info?edit=true')}
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="space-y-2 text-sm">
              <p><strong>Company:</strong> {company?.name}</p>
              <p><strong>Role:</strong> {company?.job_title}</p>
              <p><strong>Website:</strong> {company?.website}</p>
            </div>
          </CardContent>
        </Card>

        {/* Collaboration Preferences Quick View */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Collaboration Preferences</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3"
                onClick={() => setLocation('/preferences?edit=true')}
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {preferences ? (
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium mb-2">Looking to Discover</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {preferences.collabs_to_discover?.map(collab => (
                      <span key={collab} className="px-2 py-0.5 bg-primary/10 rounded-full text-xs">
                        {collab}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Ready to Host</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {preferences.collabs_to_host?.map(collab => (
                      <span key={collab} className="px-2 py-0.5 bg-primary/10 rounded-full text-xs">
                        {collab}
                      </span>
                    ))}
                  </div>
                </div>
                {preferences.notification_frequency && (
                  <div>
                    <h3 className="font-medium">Notification Frequency</h3>
                    <p>{preferences.notification_frequency}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No preferences set</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}