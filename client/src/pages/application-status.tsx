import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import type { ProfileData } from '@/types/profile';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileCheck } from 'lucide-react';

export default function ApplicationStatus() {
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });
  const [_, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile?.user) {
    return (
      <div className="p-4 text-center min-h-[100svh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">No Application Found</h1>
        <p className="text-muted-foreground mb-4">Please complete the application process.</p>
        <Button className="w-full max-w-xs" onClick={() => setLocation('/apply')}>
          Start Application
        </Button>
      </div>
    );
  }

  const { user, company } = profile;
  const applicationDate = user.applied_at ? format(new Date(user.applied_at), 'MMMM d, yyyy') : 'Unknown';

  return (
    <div className="min-h-[100svh] bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
        <h1 className="text-lg font-semibold">Application Status</h1>
      </div>

      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="h-8 w-8 text-primary" />
            </div>

            <h2 className="text-xl font-semibold mb-2">Application Under Review</h2>
            <p className="text-muted-foreground mb-6">
              Thanks for applying to join CollabRoom! We're reviewing your application and will notify you through Telegram once it's approved.
            </p>

            <div className="text-sm text-left space-y-3 border-t pt-6">
              <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
              <p><strong>Company:</strong> {company?.name}</p>
              <p><strong>Role:</strong> {company?.job_title}</p>
              <p><strong>Telegram:</strong> @{user.handle}</p>
              <p><strong>Applied:</strong> {applicationDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}