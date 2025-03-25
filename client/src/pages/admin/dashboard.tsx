import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Users, UserPlus } from 'lucide-react';
import React, { useState } from 'react';

// Define the profile data type that comes from the API
interface ProfileData {
  user: {
    id: string;
    is_admin: boolean;
  };
  company?: any;
  preferences?: any;
}

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [, setLocation] = useLocation();

  // Check if current user is admin
  const { data: currentUserData, isLoading: checkingAdmin } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  React.useEffect(() => {
    if (currentUserData?.user?.is_admin) {
      setIsAdmin(true);
    }
  }, [currentUserData]);

  if (checkingAdmin) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Admin Dashboard" backUrl="/dashboard" />
        <div className="mt-8">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Admin Dashboard" backUrl="/dashboard" />
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PageHeader title="Admin Dashboard" backUrl="/dashboard" />

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Applications Card */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Pending Applications
            </CardTitle>
            <CardDescription>
              Review and approve new user applications. Manage who can join the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full md:w-auto"
              onClick={() => setLocation('/admin/applications')}
            >
              Review Applications
            </Button>
          </CardContent>
        </Card>

        {/* Users Management Card */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage approved users, view their details, and use impersonation to assist users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full md:w-auto"
              onClick={() => setLocation('/admin/users')}
            >
              Manage Users
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}