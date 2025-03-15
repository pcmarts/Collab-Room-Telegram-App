import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/layout/PageHeader";
import { User, Company } from "@shared/schema";
import { Info, MessageCircle } from "lucide-react";

interface Match {
  user: User;
  company: Company;
  score: number;
}

export default function MyMatches() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ['/api/matches/confirmed'],
  });

  const openTelegramChat = (handle: string) => {
    window.open(`https://t.me/${handle}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background">
      <PageHeader
        title="My Matches"
        subtitle="View and connect with your matched collaborators"
      />

      <div className="p-4 space-y-4">
        {matches?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No matches found yet. Start discovering potential collaborators!
          </div>
        ) : (
          matches?.map((match) => (
            <Card key={match.user.id} className="relative">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {match.user.first_name} {match.user.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {match.company.job_title} at {match.company.name}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedMatch(match)}
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent>
                        <SheetHeader>
                          <SheetTitle>Match Details</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 space-y-4">
                          <section>
                            <h3 className="font-medium mb-2">Personal Details</h3>
                            <p>Name: {match.user.first_name} {match.user.last_name}</p>
                            <p>Telegram: @{match.user.handle}</p>
                            {match.user.linkedin_url && (
                              <p>LinkedIn: {match.user.linkedin_url}</p>
                            )}
                          </section>
                          
                          <section>
                            <h3 className="font-medium mb-2">Company Details</h3>
                            <p>Company: {match.company.name}</p>
                            <p>Role: {match.company.job_title}</p>
                            <p>Funding Stage: {match.company.funding_stage}</p>
                            {match.company.has_token && (
                              <p>Token: {match.company.token_ticker}</p>
                            )}
                            {match.company.blockchain_networks && (
                              <p>Networks: {match.company.blockchain_networks.join(", ")}</p>
                            )}
                          </section>
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => openTelegramChat(match.user.handle)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
