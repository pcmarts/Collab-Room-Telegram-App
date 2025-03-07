import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocation } from 'wouter';
import { UserIcon, Settings, Users, Building, Star, Bell, Coffee } from 'lucide-react';
import type { User, Company, Preferences } from '@shared/schema';
import { NOTIFICATION_FREQUENCIES } from '@shared/schema';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProfileData {
  user: User;
  company: Company;
  preferences: Preferences;
}

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState(
    profile?.preferences?.notification_frequency || 'Daily'
  );

  const handleNotificationSettingsChange = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    if (!enabled) {
      try {
        setIsSubmitting(true);
        const response = await apiRequest('POST', '/api/preferences', {
          ...profile?.preferences,
          notification_frequency: 'Never'
        });

        if (!response.ok) {
          throw new Error('Failed to update notification settings');
        }

        toast({
          title: "Success",
          description: "Notifications have been disabled",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update notification settings"
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFrequencyChange = async (frequency: string) => {
    try {
      setIsSubmitting(true);
      const response = await apiRequest('POST', '/api/preferences', {
        ...profile?.preferences,
        notification_frequency: frequency
      });

      if (!response.ok) {
        throw new Error('Failed to update notification frequency');
      }

      setNotificationFrequency(frequency);
      toast({
        title: "Success",
        description: "Notification frequency updated",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update notification frequency"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <p className="text-muted-foreground mb-4">Please complete the application process.</p>
        <Button className="w-full max-w-xs" onClick={() => setLocation('/apply')}>
          Apply to Join
        </Button>
      </div>
    );
  }

  // Redirect to application status if user is not approved
  if (!profile.user.is_approved) {
    setLocation('/application-status');
    return null;
  }

  const { user } = profile;

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
        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            className="h-24 flex-col bg-primary text-primary-foreground"
            onClick={() => setLocation('/create-collaboration')}
          >
            <Star className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Create Collab</span>
          </Button>
          <Button
            className="h-24 flex-col bg-primary text-primary-foreground"
            onClick={() => setLocation('/collab-preferences')}
          >
            <Settings className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Match Settings</span>
          </Button>
        </div>

        {/* Quick Actions - Second Row */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setLocation('/my-collaborations')}
          >
            <Users className="h-5 w-5 mb-1.5" />
            <span className="text-xs">My Collaborations</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setLocation('/my-applications')}
          >
            <Star className="h-5 w-5 mb-1.5" />
            <span className="text-xs">My Applications</span>
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
                <Star className="h-5 w-5 mb-1.5 text-primary" />
                <span className="text-xl font-bold">0</span>
                <span className="text-xs text-muted-foreground">Opportunities</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setLocation('/profile-overview')}
          >
            <UserIcon className="h-5 w-5 mb-1.5" />
            <span className="text-xs">My Profile</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col"
            onClick={() => setLocation('/company-info')}
          >
            <Building className="h-5 w-5 mb-1.5" />
            <span className="text-xs">Company Info</span>
          </Button>
        </div>

        {/* Notification Settings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationSettingsChange}
              />
            </div>
          </CardHeader>
          {notificationsEnabled && (
            <CardContent>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={notificationFrequency}
                  onValueChange={handleFrequencyChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_FREQUENCIES.map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>
                        {frequency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}