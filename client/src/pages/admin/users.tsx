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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import {
  Calendar,
  Building2,
  AtSign,
  Briefcase,
  Building,
  Coins,
  Link2,
  MessageCircle,
  Twitter,
  LinkedinIcon,
  Users,
  Gift,
  Clock,
  Tag
} from 'lucide-react';

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
  created_at: string;
  linkedin_url?: string;
  twitter_url?: string;
  twitter_followers?: string;
  referral_code?: string;
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
  };
}

export default function AdminUsers() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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
      setSelectedUser(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <div className="space-y-4">
                {pendingUsers.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No pending applications
                  </div>
                ) : (
                  pendingUsers.map((user: User) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {user.company?.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {user.first_name} {user.last_name} • {user.company?.job_title}
                          </p>
                        </div>
                        <Button
                          onClick={() => setSelectedUser(user)}
                        >
                          Review Application
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedUser?.company?.name}
            </DialogTitle>
            <DialogDescription>
              Application submitted on {selectedUser?.applied_at && formatDate(selectedUser.applied_at)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Applicant Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Applicant Information</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{selectedUser?.first_name} {selectedUser?.last_name}</span>
                  <span className="text-muted-foreground">(@{selectedUser?.handle})</span>
                </div>

                {selectedUser?.email && (
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4" />
                    <span>{selectedUser.email}</span>
                  </div>
                )}

                {selectedUser?.linkedin_url && (
                  <div className="flex items-center gap-2">
                    <LinkedinIcon className="h-4 w-4" />
                    <a href={selectedUser.linkedin_url} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline">LinkedIn Profile</a>
                  </div>
                )}

                {selectedUser?.twitter_url && (
                  <div className="flex items-center gap-2">
                    <Twitter className="h-4 w-4" />
                    <a href={selectedUser.twitter_url} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline">Twitter Profile</a>
                    {selectedUser.twitter_followers && (
                      <span className="text-sm text-muted-foreground">
                        ({selectedUser.twitter_followers} followers)
                      </span>
                    )}
                  </div>
                )}

                {selectedUser?.referral_code && (
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    <span>Referral Code: {selectedUser.referral_code}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    Account created: {selectedUser?.created_at && formatDate(selectedUser.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Company Information */}
            {selectedUser?.company && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{selectedUser.company.job_title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <a href={selectedUser.company.website} target="_blank" rel="noopener noreferrer" 
                       className="text-primary hover:underline">
                      Company Website
                    </a>
                  </div>

                  {selectedUser.company.linkedin_url && (
                    <div className="flex items-center gap-2">
                      <LinkedinIcon className="h-4 w-4" />
                      <a href={selectedUser.company.linkedin_url} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline">Company LinkedIn</a>
                    </div>
                  )}

                  {selectedUser.company.twitter_handle && (
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4" />
                      <a href={`https://twitter.com/${selectedUser.company.twitter_handle}`} 
                         target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline">
                        @{selectedUser.company.twitter_handle}
                      </a>
                      {selectedUser.company.twitter_followers && (
                        <span className="text-sm text-muted-foreground">
                          ({selectedUser.company.twitter_followers} followers)
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    <span>Funding Stage: {selectedUser.company.funding_stage}</span>
                  </div>

                  {selectedUser.company.has_token && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Token: {selectedUser.company.token_ticker}</span>
                      </div>
                      {selectedUser.company.blockchain_networks && (
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.company.blockchain_networks.map((network) => (
                            <Badge key={network} variant="outline">
                              {network}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedUser.company.tags && selectedUser.company.tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <span className="font-medium">Tags:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.company.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4">
              <div className="space-x-2">
                <Button
                  variant="destructive"
                  onClick={() => {
                    // TODO: Implement reject functionality
                    toast({
                      title: "Not Implemented",
                      description: "Reject functionality coming soon"
                    });
                  }}
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleMessageUser(selectedUser?.handle)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
              <Button
                onClick={() => selectedUser && approveUserMutation.mutate(selectedUser.id)}
                disabled={approveUserMutation.isPending}
              >
                Approve Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}