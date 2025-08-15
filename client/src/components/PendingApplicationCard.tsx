import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface PendingApplicationCardProps {
  userFirstName?: string;
  companyName?: string;
  companyLogoUrl?: string;
  submissionDate?: string;
}

export function PendingApplicationCard({ userFirstName, companyName, companyLogoUrl, submissionDate }: PendingApplicationCardProps) {
  const getSubmissionTime = () => {
    if (!submissionDate) return null;
    try {
      return formatDistanceToNow(new Date(submissionDate), { addSuffix: true });
    } catch {
      return null;
    }
  };
  return (
    <Card className="p-5 mb-6 border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-lg ring-1 ring-orange-200/50 hover:shadow-xl transition-shadow duration-200">
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
            <Clock className="w-6 h-6 text-orange-700" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-orange-800 mb-1">
            Your application is under review
          </h3>
          <div className="space-y-1">
            {userFirstName && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Name:</span> {userFirstName}
              </p>
            )}
            {companyName && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Company:</span> {companyName}
              </p>
            )}
            {!userFirstName && !companyName && (
              <p className="text-sm text-gray-600">Application status</p>
            )}
          </div>
          {getSubmissionTime() && (
            <p className="text-xs text-gray-500 mt-1">
              Submitted {getSubmissionTime()}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}