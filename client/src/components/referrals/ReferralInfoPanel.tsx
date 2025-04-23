import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReferralCard } from './ReferralCard';
import { ReferredUsersList } from './ReferredUsersList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PanelBottom, UserPlus } from 'lucide-react';
import { useReferrals } from '@/hooks/use-referrals';

const ReferralInfoPanel = () => {
  const [activeTab, setActiveTab] = useState('invite');
  const { referredUsers, isLoading } = useReferrals();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Friend Referrals</CardTitle>
        <CardDescription>
          Invite friends to join Collab Room and see who you've referred
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="invite" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Invite Friends</span>
            </TabsTrigger>
            <TabsTrigger value="referred" className="flex items-center gap-2">
              <PanelBottom className="h-4 w-4" />
              <span>My Referrals</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="invite" className="mt-0">
            <ReferralCard />
          </TabsContent>
          
          <TabsContent value="referred" className="mt-0">
            <ReferredUsersList users={referredUsers} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export { ReferralInfoPanel };
export default ReferralInfoPanel;