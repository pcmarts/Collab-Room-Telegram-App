import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import type { User, Company, Preferences } from '@shared/schema';

interface ProfileData {
  user: User;
  company: Company;
  preferences: Preferences;
}

export default function ProfileOverview() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
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
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground">Please complete the onboarding process.</p>
        <Button className="mt-4" onClick={() => setLocation('/onboarding')}>
          Complete Profile
        </Button>
      </div>
    );
  }

  const { user, company } = profile;

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center -ml-3"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Profile Overview</h1>
          <div className="w-12" /> {/* Spacer for alignment */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Personal Information</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/onboarding?edit=true')}
                className="h-8 px-3"
              >
                Edit
              </Button>
            </div>
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
            {user.linkedin_url && (
              <div>
                <h3 className="font-medium">LinkedIn</h3>
                <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" 
                   className="text-primary hover:underline">
                  View Profile
                </a>
              </div>
            )}
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
            <div className="flex justify-between items-center">
              <CardTitle>Company Information</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/company-info?edit=true')}
                className="h-8 px-3"
              >
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Company Name</h3>
              <p>{company.name}</p>
            </div>
            <div>
              <h3 className="font-medium">Job Title</h3>
              <p>{company.job_title}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Social Links</h3>
              <div className="space-x-4">
                <a href={company.website} target="_blank" rel="noopener noreferrer" 
                   className="text-primary hover:underline">Website</a>
                {company.twitter_handle && (
                  <a href={`https://twitter.com/${company.twitter_handle}`} target="_blank" 
                     rel="noopener noreferrer" className="text-primary hover:underline">Twitter</a>
                )}
                {company.linkedin_url && (
                  <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" 
                     className="text-primary hover:underline">LinkedIn</a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}