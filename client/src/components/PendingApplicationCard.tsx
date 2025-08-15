import { Clock, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface PendingApplicationCardProps {
  userFirstName?: string;
  companyName?: string;
  companyLogoUrl?: string;
}

export function PendingApplicationCard({ userFirstName, companyName, companyLogoUrl }: PendingApplicationCardProps) {
  const [, setLocation] = useLocation();

  return (
    <Card className="p-4 mb-4 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            {companyLogoUrl ? (
              <img 
                src={companyLogoUrl} 
                alt={`${companyName} logo`}
                className="w-12 h-12 rounded-lg object-cover"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center ${companyLogoUrl ? 'hidden' : 'flex'}`}
            >
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Application Submitted
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {companyName && userFirstName 
                ? `${userFirstName} from ${companyName} • Under review`
                : userFirstName 
                ? `${userFirstName} • Under review`
                : "Your application is under review"}
            </p>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            Dashboard
          </Button>
        </div>
      </div>
    </Card>
  );
}