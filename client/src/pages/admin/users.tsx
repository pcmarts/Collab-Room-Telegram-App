import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { Calendar, Building2, AtSign, Briefcase, ChevronDown, ChevronUp, Building, Coins, Link2 } from 'lucide-react';

// Define expanded User interface for this component
interface User {
  id: string;
  telegram_id: string;
  first_name: string;
  last_name?: string;
  email?: string;
  handle?: string;
  is_admin: boolean;
  is_approved: boolean;
  applied_at: string;
  linkedin_url?: string;
  twitter_url?: string;
  twitter_followers?: string;
  company?: {
    name: string;
    website: string;
    job_title: string;
    twitter_handle?: string;
    twitter_followers?: number;
    linkedin_url?: string;
    funding_stage: string;
    has_token: boolean;
    token_ticker?: string;
    blockchain_networks?: string[];
    tags?: string[];
    short_description?: string;
    long_description?: string;
  };
}

export default function AdminUsers() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Check if current user is admin
  const { data: currentUserData, isLoading: checkingAdmin } = useQuery({
    queryKey: ['/api/profile']
  });

  // Effect to handle admin status update
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

  // Mutation for approving a user
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('/api/admin/approve-user', 'POST', {
        userId
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Success",
        description: "User has been approved"
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve user"
      });
    }
  });

  // Filter for unapproved users
  const pendingUsers = users.filter(user => !user.is_approved);

  const toggleUserExpand = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  if (checkingAdmin) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Pending Applications" backUrl="/dashboard" />
        <div className="mt-8">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-6 px-4">
        <PageHeader title="Pending Applications" backUrl="/dashboard" />
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
      <PageHeader title="Pending Applications" backUrl="/dashboard" />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Review Applications</CardTitle>
            <CardDescription>
              Review and approve new user applications. {pendingUsers.length} pending applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading applications...</div>
            ) : (
              <div className="space-y-6">
                {pendingUsers.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No pending applications
                  </div>
                ) : (
                  pendingUsers.map((user: User) => (
                    <Card key={user.id} className="p-4">
                      <div className="space-y-4">
                        {/* User Basic Info */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {user.first_name} {user.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              @{user.handle || 'No handle'}
                            </p>
                          </div>
                          <Button
                            onClick={() => approveUserMutation.mutate(user.id)}
                            disabled={approveUserMutation.isPending}
                          >
                            Approve Application
                          </Button>
                        </div>

                        {/* Contact & Social Links */}
                        <div className="grid gap-2 text-sm">
                          {user.email && (
                            <div className="flex items-center gap-2">
                              <AtSign className="h-4 w-4" />
                              <span>{user.email}</span>
                            </div>
                          )}
                          {user.linkedin_url && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" 
                                 className="text-primary hover:underline">
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Company Information */}
                        {user.company && (
                          <>
                            <Separator className="my-4" />
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Building className="h-5 w-5" />
                                  <h4 className="font-semibold">{user.company.name}</h4>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleUserExpand(user.id)}
                                >
                                  {expandedUser === user.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>

                              <div className="grid gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{user.company.job_title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Link2 className="h-4 w-4" />
                                  <a href={user.company.website} target="_blank" rel="noopener noreferrer" 
                                     className="text-primary hover:underline">
                                    Company Website
                                  </a>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Coins className="h-4 w-4" />
                                  <span>Funding Stage: {user.company.funding_stage}</span>
                                </div>
                              </div>

                              {expandedUser === user.id && (
                                <div className="mt-4 space-y-4">
                                  {user.company.short_description && (
                                    <div>
                                      <Label className="text-sm font-medium">Company Description</Label>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        {user.company.short_description}
                                      </p>
                                    </div>
                                  )}

                                  {user.company.has_token && (
                                    <div>
                                      <Label className="text-sm font-medium">Token Details</Label>
                                      <div className="mt-1 space-y-1">
                                        <p className="text-sm">Token: {user.company.token_ticker}</p>
                                        {user.company.blockchain_networks && (
                                          <div className="flex flex-wrap gap-2">
                                            {user.company.blockchain_networks.map((network) => (
                                              <Badge key={network} variant="outline">
                                                {network}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {user.company.tags && user.company.tags.length > 0 && (
                                    <div>
                                      <Label className="text-sm font-medium">Company Tags</Label>
                                      <div className="mt-1 flex flex-wrap gap-2">
                                        {user.company.tags.map((tag) => (
                                          <Badge key={tag} variant="secondary">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* Application Date */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Applied on {new Date(user.applied_at).toLocaleDateString()}</span>
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