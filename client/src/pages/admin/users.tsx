import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import {
  AtSign,
  User,
  Building,
  MessageCircle,
} from 'lucide-react';

interface User {
  id: string;
  telegram_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  handle?: string;
  is_admin: boolean;
  is_approved: boolean;
  company?: {
    name: string;
    job_title: string;
  };
}

export default function AdminUsers() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [, setLocation] = useLocation();

  // Check if current user is admin
  const { data: currentUserData, isLoading: checkingAdmin } = useQuery({
    queryKey: ['/api/profile']
  });

  React.useEffect(() => {
    if (currentUserData?.user?.is_admin) {
      setIsAdmin(true);
    }
  }, [currentUserData]);

  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAdmin,
    retry: false
  });

  // Mutation for starting impersonation
  const startImpersonationMutation = useMutation({
    mutationFn: async (telegram_id: string) => {
      console.log('Starting impersonation for:', telegram_id);
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegram_id }),
        credentials: 'include' // Important for session handling
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start impersonation');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Impersonation Started",
        description: "You are now viewing the application as the selected user"
      });
      // Redirect to dashboard after impersonation starts
      setLocation('/dashboard');
    },
    onError: (error: Error) => {
      console.error('Impersonation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start impersonation"
      });
    }
  });

  const handleImpersonate = (telegram_id: string) => {
    startImpersonationMutation.mutate(telegram_id);
  };

  const handleMessageUser = (handle?: string) => {
    if (handle) {
      window.open(`https://t.me/${handle}`, '_blank');
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User has no Telegram handle"
      });
    }
  };

  // Filter for approved users
  const approvedUsers = users.filter(user => user.is_approved);

  if (checkingAdmin) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Manage Users" backUrl="/admin" />
        <div className="mt-8">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Manage Users" backUrl="/admin" />
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
      <PageHeader title="Manage Users" backUrl="/admin" />

      <div className="mt-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Approved Users</CardTitle>
            <CardDescription>
              View and manage approved users. {approvedUsers.length} total users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading users...</div>
            ) : (
              <div className="space-y-3">
                {approvedUsers.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No approved users found
                  </div>
                ) : (
                  approvedUsers.map((user: User) => (
                    <Card key={user.id} className="p-4">
                      <div className="space-y-2.5">
                        {/* User Info Section */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              @{user.handle}
                            </span>
                          </div>

                          {user.email && (
                            <div className="flex items-center gap-2 ml-6 text-sm">
                              <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{user.email}</span>
                            </div>
                          )}

                          {user.company && (
                            <div className="flex items-center gap-2 ml-6 text-sm">
                              <Building className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-medium">{user.company.name}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground">{user.company.job_title}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons - Full width on mobile, inline on desktop */}
                        <div className="space-y-2 sm:space-y-0 sm:space-x-2 sm:flex sm:justify-end pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => handleMessageUser(user.handle)}
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Message
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => handleImpersonate(user.telegram_id)}
                            disabled={startImpersonationMutation.isPending}
                          >
                            Impersonate
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}