import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocation } from 'wouter';
import { UserIcon, Users, Building, Star, Bell, Coffee, Calendar, Rocket, Plus } from 'lucide-react';
import type { 
  User as UserType, 
  Company, 
  Preferences, 
  MarketingPreferences, 
  ConferencePreferences 
} from '@shared/schema';
import { NOTIFICATION_FREQUENCIES } from '@shared/schema';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProfileData {
  user: UserType;
  company: Company;
  preferences: Preferences;
  marketingPreferences: MarketingPreferences;
  conferencePreferences: ConferencePreferences;
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
    try {
      setIsSubmitting(true);
      
      const newFrequency = enabled ? 'Daily' : 'Never';
      
      // We need to preserve marketing and conference preferences
      const response = await apiRequest('/api/preferences', 'POST', {
        notification_frequency: newFrequency,
        
        // Include marketing preferences
        collabs_to_discover: profile?.marketingPreferences?.collabs_to_discover || [],
        collabs_to_host: profile?.marketingPreferences?.collabs_to_host || [],
        excluded_tags: profile?.marketingPreferences?.filtered_marketing_topics || [],
        twitter_collabs: profile?.marketingPreferences?.twitter_collabs || [],
        
        // Include conference preferences
        coffee_match_enabled: profile?.conferencePreferences?.coffee_match_enabled || false,
        coffee_match_company_sectors: profile?.conferencePreferences?.coffee_match_company_sectors || [],
        coffee_match_company_followers: profile?.conferencePreferences?.coffee_match_company_followers || null,
        coffee_match_user_followers: profile?.conferencePreferences?.coffee_match_user_followers || null,
        coffee_match_funding_stages: profile?.conferencePreferences?.coffee_match_funding_stages || [],
        coffee_match_token_status: profile?.conferencePreferences?.coffee_match_token_status || false,
        coffee_match_filter_company_sectors_enabled: profile?.conferencePreferences?.coffee_match_filter_company_sectors_enabled || false,
        coffee_match_filter_company_followers_enabled: profile?.conferencePreferences?.coffee_match_filter_company_followers_enabled || false,
        coffee_match_filter_user_followers_enabled: profile?.conferencePreferences?.coffee_match_filter_user_followers_enabled || false,
        coffee_match_filter_funding_stages_enabled: profile?.conferencePreferences?.coffee_match_filter_funding_stages_enabled || false,
        coffee_match_filter_token_status_enabled: profile?.conferencePreferences?.coffee_match_filter_token_status_enabled || false
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }
      
      // Update the local state if toggling on
      if (enabled) {
        setNotificationFrequency('Daily');
      }

      toast({
        title: "Success",
        description: enabled ? "Notifications have been enabled" : "Notifications have been disabled",
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
  };

  const handleFrequencyChange = async (frequency: string) => {
    try {
      setIsSubmitting(true);
      
      // We need to preserve marketing and conference preferences
      const response = await apiRequest('/api/preferences', 'POST', {
        notification_frequency: frequency,
        
        // Include marketing preferences
        collabs_to_discover: profile?.marketingPreferences?.collabs_to_discover || [],
        collabs_to_host: profile?.marketingPreferences?.collabs_to_host || [],
        excluded_tags: profile?.marketingPreferences?.filtered_marketing_topics || [],
        twitter_collabs: profile?.marketingPreferences?.twitter_collabs || [],
        
        // Include conference preferences
        coffee_match_enabled: profile?.conferencePreferences?.coffee_match_enabled || false,
        coffee_match_company_sectors: profile?.conferencePreferences?.coffee_match_company_sectors || [],
        coffee_match_company_followers: profile?.conferencePreferences?.coffee_match_company_followers || null,
        coffee_match_user_followers: profile?.conferencePreferences?.coffee_match_user_followers || null,
        coffee_match_funding_stages: profile?.conferencePreferences?.coffee_match_funding_stages || [],
        coffee_match_token_status: profile?.conferencePreferences?.coffee_match_token_status || false,
        coffee_match_filter_company_sectors_enabled: profile?.conferencePreferences?.coffee_match_filter_company_sectors_enabled || false,
        coffee_match_filter_company_followers_enabled: profile?.conferencePreferences?.coffee_match_filter_company_followers_enabled || false,
        coffee_match_filter_user_followers_enabled: profile?.conferencePreferences?.coffee_match_filter_user_followers_enabled || false,
        coffee_match_filter_funding_stages_enabled: profile?.conferencePreferences?.coffee_match_filter_funding_stages_enabled || false,
        coffee_match_filter_token_status_enabled: profile?.conferencePreferences?.coffee_match_filter_token_status_enabled || false
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
        {/* Marketing Collaboration Section */}
        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Marketing Collaborations
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-20 flex-col bg-primary text-primary-foreground"
              onClick={() => setLocation('/marketing-collabs')}
            >
              <Rocket className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Manage Collabs</span>
            </Button>
            <Button
              className="h-20 flex-col"
              variant="outline"
              onClick={() => setLocation('/collab-preferences')}
            >
              <Star className="h-5 w-5 mb-1.5" />
              <span className="text-xs">Collab Preferences</span>
            </Button>
          </div>
        </div>

        {/* Conference Networking Section */}
        <div className="space-y-3 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Conference Networking
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-20 flex-col bg-primary text-primary-foreground"
              onClick={() => setLocation('/conference-coffees')}
            >
              <Coffee className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">Coffee Matches</span>
            </Button>
            <Button
              className="h-20 flex-col"
              variant="outline"
              onClick={() => setLocation('/matching-filters')}
            >
              <Star className="h-5 w-5 mb-1.5" />
              <span className="text-xs">Match Preferences</span>
            </Button>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profile Management
          </h2>
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
              <span className="text-xs">My Company</span>
            </Button>
          </div>
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