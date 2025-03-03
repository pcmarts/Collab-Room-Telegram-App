import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import type { User, Company, UserPreferences } from '@shared/schema';

interface ProfileData {
  user: User;
  company: Company;
  preferences: UserPreferences;
}

export default function ProfileOverview() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
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
      <div className="p-8 text-center">
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Profile Overview</h1>
        <Button onClick={() => setLocation('/onboarding?edit=true')}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="space-y-8">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Name</h3>
              <p>{user.first_name} {user.last_name}</p>
            </div>
            <div>
              <h3 className="font-medium">Telegram Handle</h3>
              <p>{user.handle}</p>
            </div>
            <div>
              <h3 className="font-medium">LinkedIn</h3>
              <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" 
                 className="text-primary hover:underline">
                View Profile
              </a>
            </div>
            {user.email && (
              <div>
                <h3 className="font-medium">Email</h3>
                <p>{user.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Company Name</h3>
              <p>{company.name}</p>
            </div>
            <div>
              <h3 className="font-medium">Category</h3>
              <p>{company.category}</p>
            </div>
            <div>
              <h3 className="font-medium">Size</h3>
              <p>{company.size}</p>
            </div>
            <div>
              <h3 className="font-medium">Funding Stage</h3>
              <p>{company.funding_stage}</p>
            </div>
            <div>
              <h3 className="font-medium">Geographic Focus</h3>
              <p>{company.geographic_focus}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Social Links</h3>
              <div className="space-x-4">
                <a href={company.website} target="_blank" rel="noopener noreferrer" 
                   className="text-primary hover:underline">Website</a>
                <a href={`https://twitter.com/${company.twitter_handle}`} target="_blank" 
                   rel="noopener noreferrer" className="text-primary hover:underline">Twitter</a>
                <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" 
                   className="text-primary hover:underline">LinkedIn</a>
                {company.telegram_group && (
                  <a href={company.telegram_group} target="_blank" rel="noopener noreferrer" 
                     className="text-primary hover:underline">Telegram</a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collaboration Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Collaboration Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Looking to Discover</h3>
              <div className="flex flex-wrap gap-2">
                {preferences.collabs_to_discover.map(collab => (
                  <span key={collab} className="px-2 py-1 bg-primary/10 rounded-full text-sm">
                    {collab}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Ready to Host</h3>
              <div className="flex flex-wrap gap-2">
                {preferences.collabs_to_host.map(collab => (
                  <span key={collab} className="px-2 py-1 bg-primary/10 rounded-full text-sm">
                    {collab}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium">Notification Frequency</h3>
              <p className="capitalize">{preferences.notification_frequency}</p>
            </div>
            {preferences.additional_opportunities && (
              <div>
                <h3 className="font-medium">Additional Interests</h3>
                <p>{preferences.additional_opportunities}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
