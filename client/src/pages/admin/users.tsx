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
      const response = await apiRequest('/api/admin/impersonate', 'POST', {
        telegram_id
      });
      return response;
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
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start impersonation"
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
        <PageHeader title="Manage Users" backUrl="/dashboard" />
        <div className="mt-8">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Manage Users" backUrl="/dashboard" />
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
      <PageHeader title="Manage Users" backUrl="/dashboard" />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Approved Users</CardTitle>
            <CardDescription>
              View and manage approved users. {approvedUsers.length} total users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading users...</div>
            ) : (
              <div className="space-y-4">
                {approvedUsers.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No approved users found
                  </div>
                ) : (
                  approvedUsers.map((user: User) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="text-muted-foreground">
                              (@{user.handle})
                            </span>
                          </div>

                          {user.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <AtSign className="h-4 w-4" />
                              <span>{user.email}</span>
                            </div>
                          )}

                          {user.company && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building className="h-4 w-4" />
                              <span>{user.company.name}</span>
                              <span className="text-muted-foreground">
                                • {user.company.job_title}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMessageUser(user.handle)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
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