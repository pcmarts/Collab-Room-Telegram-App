import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PendingApplicationCardProps {
  userFirstName?: string;
  companyName?: string;
  companyLogoUrl?: string;
}

export function PendingApplicationCard({ userFirstName, companyName, companyLogoUrl }: PendingApplicationCardProps) {
  return (
    <Card className="p-4 mb-4 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
      <div className="flex items-center space-x-4">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          {companyLogoUrl ? (
            <img 
              src={companyLogoUrl} 
              alt={`${companyName} logo`}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center ${companyLogoUrl ? 'hidden' : 'flex'}`}
          >
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Your application is under review
          </h3>
          <p className="text-sm text-gray-600">
            {companyName && userFirstName 
              ? `${userFirstName} from ${companyName}`
              : userFirstName 
              ? userFirstName
              : "Application status"}
          </p>
        </div>
      </div>
    </Card>
  );
}