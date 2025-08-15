import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface PendingApplicationCardProps {
  userFirstName?: string;
}

export function PendingApplicationCard({ userFirstName }: PendingApplicationCardProps) {
  const [, setLocation] = useLocation();

  return (
    <Card className="p-6 mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Application Under Review
          </h3>
          <p className="text-gray-700 mb-4">
            {userFirstName ? `Hi ${userFirstName}! ` : ""}Your application to join The Collab Room is currently being reviewed by our team. You'll receive a notification once it's approved.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Application submitted successfully</span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">Under review by our team</span>
            </div>
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Approval notification pending</span>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            View Dashboard
          </Button>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-orange-100 rounded-md">
        <p className="text-sm text-orange-800">
          <strong>What's next?</strong> Once approved, you'll be able to create collaborations, respond to requests, and connect with other professionals in the Web3 space.
        </p>
      </div>
    </Card>
  );
}