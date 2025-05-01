import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';

// Define types for referral data
interface ReferralEvent {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
  completed_at: string | null;
  referrer: {
    first_name: string;
    last_name: string | null;
    handle: string;
  };
  referred_user: {
    first_name: string;
    last_name: string | null;
    handle: string;
  };
}

// Define the admin page for managing referrals
export default function AdminReferralsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Fetch referral events
  const { data: events, isLoading, isError, error, refetch } = useQuery<ReferralEvent[]>({
    queryKey: ['/api/referrals/admin/events'],
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });

  // Filter events based on search query and status
  const filteredEvents = events?.filter(event => {
    // Filter by status if selected
    if (statusFilter && event.status !== statusFilter) {
      return false;
    }
    
    // Filter by search query if provided
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const referrerName = `${event.referrer.first_name} ${event.referrer.last_name || ''}`.toLowerCase();
      const referredName = `${event.referred_user.first_name} ${event.referred_user.last_name || ''}`.toLowerCase();
      
      return (
        referrerName.includes(searchLower) ||
        referredName.includes(searchLower) ||
        event.referrer.handle.toLowerCase().includes(searchLower) ||
        event.referred_user.handle.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Calculate stats
  const stats = {
    total: events?.length || 0,
    completed: events?.filter(e => e.status === 'completed').length || 0,
    pending: events?.filter(e => e.status === 'pending').length || 0,
    expired: events?.filter(e => e.status === 'expired').length || 0,
  };
  
  // Function to export data as CSV
  const exportCSV = () => {
    if (!events || events.length === 0) return;
    
    // Create CSV content
    const headers = [
      'ID', 'Referrer Name', 'Referrer Handle', 
      'Referred User Name', 'Referred User Handle', 
      'Status', 'Created', 'Completed'
    ].join(',');
    
    const rows = events.map(event => {
      return [
        event.id,
        `${event.referrer.first_name} ${event.referrer.last_name || ''}`,
        event.referrer.handle,
        `${event.referred_user.first_name} ${event.referred_user.last_name || ''}`,
        event.referred_user.handle,
        event.status,
        new Date(event.created_at).toLocaleString(),
        event.completed_at ? new Date(event.completed_at).toLocaleString() : '-'
      ].join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `referrals_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // This disables the default fixed positioning and overflow hidden
  // so that we can have a normal scrolling container with a scrollbar
  useEffect(() => {
    // Save the original style
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    // Modify for this page to allow scrolling
    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.width = "auto";
    document.body.style.height = "auto";

    // Cleanup function to restore original styles when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
    };
  }, []);

  return (
    <div className="page-scrollable pb-20">
      <PageHeader
        title="Referral Management"
        subtitle="Monitor and manage all referrals in the system"
        backUrl="/admin/dashboard"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
            <CardDescription>Total Referrals</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-emerald-500">{stats.completed}</CardTitle>
            <CardDescription>Completed Referrals</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-amber-500">{stats.pending}</CardTitle>
            <CardDescription>Pending Referrals</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-gray-500">{stats.expired}</CardTitle>
            <CardDescription>Expired Referrals</CardDescription>
          </CardHeader>
        </Card>
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Referral Events</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportCSV}
                disabled={!events || events.length === 0}
              >
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
              >
                <Loader2 className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
          <CardDescription>
            View all referral activity in the system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <div className="relative w-full md:w-1/3">
              <Input
                placeholder="Search by name or handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-2.5 text-gray-500">
                <Users className="h-4 w-4" />
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-500">Status:</span>
              <Badge 
                className={`cursor-pointer ${!statusFilter ? 'bg-primary' : 'bg-gray-500'}`}
                onClick={() => setStatusFilter(null)}
              >
                All
              </Badge>
              <Badge 
                className={`cursor-pointer ${statusFilter === 'completed' ? 'bg-emerald-500' : 'bg-gray-500'}`}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </Badge>
              <Badge 
                className={`cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-500' : 'bg-gray-500'}`}
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Badge>
              <Badge 
                className={`cursor-pointer ${statusFilter === 'expired' ? 'bg-gray-500' : 'bg-gray-700'}`}
                onClick={() => setStatusFilter('expired')}
              >
                Expired
              </Badge>
            </div>
          </div>
          
          {isError ? (
            <div className="text-center py-6 text-red-500">
              Error loading referral data. Please try again.
            </div>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referred User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="font-medium">
                          {event.referrer.first_name} {event.referrer.last_name || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{event.referrer.handle}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {event.referred_user.first_name} {event.referred_user.last_name || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{event.referred_user.handle}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            event.status === 'completed'
                              ? 'bg-emerald-500'
                              : event.status === 'pending'
                              ? 'bg-amber-500'
                              : 'bg-gray-500'
                          }
                        >
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(event.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {event.completed_at
                          ? new Date(event.completed_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              {searchQuery || statusFilter
                ? 'No referrals match your search filters.'
                : 'No referrals have been created yet.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}