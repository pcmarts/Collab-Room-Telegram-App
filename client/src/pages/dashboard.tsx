import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocation } from 'wouter';
import { UserIcon, Users, Building, Star, Bell, Calendar, Plus, Settings, Clock } from 'lucide-react';
import { FaLinkedin, FaTwitter } from 'react-icons/fa';
import { NetworkStatus } from "@/components/NetworkStatus";
import { PageHeader } from "../components/PageHeader";
import type { 
  User as UserType, 
  Company, 
  NotificationPreferences, 
  MarketingPreferences 
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
}

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: profile, isLoading, refetch } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    // Use refetchOnMount and staleTime: 0 to ensure fresh data each time
    staleTime: 0,
    refetchOnMount: true
  });

  // Initial state - will be updated when profile loads
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState('Instant');
  
  // Update state when profile loads
  useEffect(() => {
    console.log('Dashboard - Profile data received:', profile);
    
    if (profile?.notificationPreferences) {
      console.log('Dashboard - Raw notification preferences:', JSON.stringify(profile.notificationPreferences, null, 2));
      
      // Make sure we explicitly convert the value to boolean to handle PostgreSQL boolean values properly
      // PostgreSQL can return 'f', 'false', false, or 0 for false values
      // And 't', 'true', true, or 1 for true values
      let notificationsEnabled = false;
      
      if (typeof profile.notificationPreferences.notifications_enabled === 'string') {
        // Handle string values: 't', 'true', 'f', 'false'
        const strValue = String(profile.notificationPreferences.notifications_enabled).toLowerCase();
        notificationsEnabled = ['t', 'true'].includes(strValue);
        console.log('Dashboard - String value detected:', profile.notificationPreferences.notifications_enabled);
        console.log('Dashboard - Parsed string value to boolean:', notificationsEnabled);
      } else if (typeof profile.notificationPreferences.notifications_enabled === 'boolean') {
        // Handle boolean values: true, false
        notificationsEnabled = profile.notificationPreferences.notifications_enabled;
        console.log('Dashboard - Boolean value detected:', profile.notificationPreferences.notifications_enabled);
      } else if (typeof profile.notificationPreferences.notifications_enabled === 'number') {
        // Handle number values: 1, 0
        notificationsEnabled = profile.notificationPreferences.notifications_enabled > 0;
        console.log('Dashboard - Number value detected:', profile.notificationPreferences.notifications_enabled);
        console.log('Dashboard - Parsed number value to boolean:', notificationsEnabled);
      } else {
        // Default behavior for null, undefined or other types
        notificationsEnabled = false;
        console.log('Dashboard - Unknown value type detected:', 
          typeof profile.notificationPreferences.notifications_enabled, 
          profile.notificationPreferences.notifications_enabled
        );
      }
      
      console.log('Dashboard - Final interpreted notification setting:', notificationsEnabled);
      
      // Log the current state before setting it
      console.log('Dashboard - Current notificationsEnabled state:', notificationsEnabled);
      
      // Force the value to be explicitly a boolean
      const forcedBoolean = Boolean(notificationsEnabled);
      console.log('Dashboard - Forced boolean value:', forcedBoolean);
      
      setNotificationsEnabled(forcedBoolean);
      console.log('Dashboard - State updated to:', forcedBoolean);
      
      setNotificationFrequency(profile.notificationPreferences.notification_frequency || 'Instant');
      console.log('Dashboard - Notification frequency set to:', profile.notificationPreferences.notification_frequency || 'Instant');
    } else {
      console.log('Dashboard - No notification preferences found in profile data');
    }
  }, [profile]);

  const handleNotificationSettingsChange = async (enabled: boolean) => {
    console.log('Dashboard - Notification toggle button clicked with value:', enabled);
    console.log('Dashboard - Notification toggle clicked with value type:', typeof enabled);
    
    // Update local state first for immediate UI feedback
    setNotificationsEnabled(enabled);
    console.log('Dashboard - Local state updated to:', enabled);
    
    try {
      setIsSubmitting(true);
      
      // Add a timestamp to ensure a unique request and prevent caching
      const uniqueEndpoint = `/api/notification-toggle?_t=${Date.now()}`;
      console.log('Dashboard - Making API request to:', uniqueEndpoint);
      
      // Create the payload and log it for debugging
      const payload = { enabled };
      console.log('Dashboard - API request payload:', JSON.stringify(payload));
      console.log('Dashboard - API request payload type:', typeof payload.enabled);
      
      // Use the simplified notification toggle endpoint that only updates notification preferences
      const response = await apiRequest(uniqueEndpoint, 'POST', payload);
      
      console.log('Dashboard - Toggle API response:', response);
      console.log('Dashboard - Response preferences:', response.preferences);
      
      // Check if the response has what we expect
      if (response.preferences) {
        console.log('Dashboard - Response notifications_enabled:', response.preferences.notifications_enabled);
        console.log('Dashboard - Response notifications_enabled type:', typeof response.preferences.notifications_enabled);
      }
      
      // Update the frequency state based on the toggle
      const newFrequency = enabled ? 'Instant' : 'Daily';
      setNotificationFrequency(newFrequency);
      console.log('Dashboard - Set notification frequency to:', newFrequency);
      
      // Force refresh profile data to get the latest notification preferences
      console.log('Dashboard - Refreshing profile data...');
      const refreshedData = await refetch();
      console.log('Dashboard - Refreshed profile data:', refreshedData);

      toast({
        title: "Success",
        description: enabled ? "Notifications have been enabled" : "Notifications have been disabled",
      });
    } catch (error) {
      console.error('Dashboard - Error updating notification settings:', error);
      
      // Revert local state if the API call fails
      setNotificationsEnabled(!enabled);
      
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
        
        // No conference preferences - removed as part of simplification
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

  // User needs to be approved to access the dashboard
  if (!profile.user.is_approved) {
    // Show a pending status but don't redirect to application status
    return (
      <div className="p-4 text-center min-h-[100svh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Application Pending</h1>
        <p className="text-muted-foreground mb-4">Your application is currently being processed.</p>
      </div>
    );
  }

  const { user } = profile;

  // Close Telegram WebApp loading when dashboard is ready
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
  }

  return (
    <div className="min-h-[100svh] bg-background">
      {/* Welcome Section with standardized PageHeader */}
      <PageHeader 
        title={`Welcome, ${user.first_name}!`}
      />

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

        {/* Referrals Button */}
        <Button
          variant="outline"
          className="w-full h-16 flex items-center justify-start gap-3"
          onClick={() => setLocation('/referrals')}
        >
          <Users className="h-5 w-5" />
          <span>Invite Your Friends</span>
        </Button>
        
        {/* Admin Panel Button - Only shown to admins */}
        {profile?.user?.is_admin && (
          <Button
            variant="outline"
            className="w-full h-16 flex items-center justify-start gap-3 mt-2"
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
                    {notificationFrequency}
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
        <div className="my-8">
          <NetworkStatus />
        </div>

        {/* Footer with credits */}
        <div className="text-center pt-2 pb-8 text-sm text-muted-foreground">
          <p className="mb-2">Made with ❤️ by Paul Martin</p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://www.linkedin.com/in/thisispaulmartin/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <FaLinkedin className="h-4 w-4" />
              <span>LinkedIn</span>
            </a>
            <a 
              href="https://x.com/pcmarts" 
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