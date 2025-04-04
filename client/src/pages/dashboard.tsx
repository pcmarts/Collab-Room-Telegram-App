import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocation } from 'wouter';
import { UserIcon, Users, Building, Star, Bell, Calendar, Plus, Settings } from 'lucide-react';
import { FaLinkedin, FaTwitter } from 'react-icons/fa';
import { NetworkStatus } from "@/components/NetworkStatus";
import type { 
  User as UserType, 
  Company, 
  NotificationPreferences, 
  MarketingPreferences, 
  ConferencePreferences 
} from '@shared/schema';
import { NOTIFICATION_FREQUENCIES } from '@shared/schema';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProfileData {
  user: UserType;
  company: Company;
  // Keep preferences for backward compatibility
  preferences: any;
  notificationPreferences: NotificationPreferences;
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

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    profile?.notificationPreferences?.notifications_enabled ?? true
  );
  // Always use 'Instant' as default frequency
  const [notificationFrequency, setNotificationFrequency] = useState('Instant');

  const handleNotificationSettingsChange = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    try {
      setIsSubmitting(true);
      
      const newFrequency = enabled ? 'Instant' : 'Never';
      
      // Update notification preferences
      await apiRequest('/api/preferences', 'POST', {
        // Notification preferences
        notification_frequency: newFrequency,
        notifications_enabled: enabled,
        
        // Include marketing preferences
        collabs_to_discover: profile?.marketingPreferences?.collabs_to_discover || [],
        collabs_to_host: profile?.marketingPreferences?.collabs_to_host || [],
        filtered_marketing_topics: profile?.marketingPreferences?.filtered_marketing_topics || [],
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
      
      // Update the local state if toggling on
      if (enabled) {
        setNotificationFrequency('Instant');
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
      
      // Update notification preferences
      await apiRequest('/api/preferences', 'POST', {
        // Notification preferences
        notification_frequency: frequency,
        notifications_enabled: notificationsEnabled,
        
        // Include marketing preferences
        collabs_to_discover: profile?.marketingPreferences?.collabs_to_discover || [],
        collabs_to_host: profile?.marketingPreferences?.collabs_to_host || [],
        filtered_marketing_topics: profile?.marketingPreferences?.filtered_marketing_topics || [],
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
        <h1 className="text-2xl font-bold p-2">Welcome, {user.first_name}!</h1>
      </div>

      <div className="p-4 space-y-4 pb-safe">
        {/* Profile Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
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

        {/* Admin Panel Button - Only shown to admins */}
        {profile?.user?.is_admin && (
          <Button
            variant="outline"
            className="w-full h-16 flex items-center justify-start gap-3"
            onClick={() => setLocation('/admin')}
          >
            <Settings className="h-5 w-5" />
            <span>Admin Panel</span>
          </Button>
        )}

        {/* Notification Settings */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-4 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
              <div className="flex items-center gap-2">
                {notificationsEnabled && (
                  <div className="h-7 text-xs px-2 text-primary">
                    Instant
                  </div>
                )}
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationSettingsChange}
                  className="scale-75"
                />
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Network Stats - Moved below notifications */}
        <div className="mt-6 mb-5">
          <NetworkStatus />
        </div>

        {/* Footer with credits */}
        <div className="text-center pt-4 pb-8 text-sm text-muted-foreground">
          <p className="mb-2">Made with ❤️ by Paul Martin</p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://www.linkedin.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <FaLinkedin className="h-4 w-4" />
              <span>LinkedIn</span>
            </a>
            <a 
              href="https://x.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <FaTwitter className="h-4 w-4" />
              <span>Twitter</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}