import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface ProfileData {
  user: {
    id: string;
    name?: string;
    is_admin: boolean;
  };
}

export default function Settings() {
  const [, setLocation] = useLocation();
  
  const { data: profile } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  return (
    <div className="container mx-auto py-6">
      <PageHeader title="Settings" />
      
      <div className="space-y-4 mt-8">
        {/* Show Admin Panel link only for admins */}
        {profile?.user?.is_admin && (
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => setLocation('/admin/users')}
          >
            🛠️ Admin Panel
          </Button>
        )}
        
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => setLocation('/profile-overview')}
        >
          👤 Profile Settings
        </Button>
      </div>
    </div>
  );
}
