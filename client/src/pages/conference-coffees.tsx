import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Event, UserEvent } from "@shared/schema";
import { useLocation } from "wouter";

interface EventWithAttending extends Event {
  isAttending: boolean;
}

export default function ConferenceCoffees() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch events and user's attending events
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events']
  });

  const { data: userEvents } = useQuery<UserEvent[]>({
    queryKey: ['/api/user-events']
  });

  // Combine events with user's attending status
  const eventsWithAttending: EventWithAttending[] = events?.map(event => ({
    ...event,
    isAttending: userEvents?.some(ue => ue.event_id === event.id) || false
  })) || [];

  // Filter out past events
  const activeEvents = eventsWithAttending.filter(event => 
    new Date(event.end_date) > new Date()
  ).sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  const toggleEventAttendance = async (eventId: string) => {
    try {
      setIsSubmitting(true);

      const response = await apiRequest(
        'POST',
        '/api/user-events',
        { event_id: eventId }
      );

      if (!response.ok) {
        throw new Error('Failed to update event attendance');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/user-events'] });

      toast({
        title: "Success!",
        description: "Your conference selection has been updated",
        duration: 2000
      });

    } catch (error) {
      console.error('Failed to update event attendance:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event attendance"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
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
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center -ml-3"
            onClick={() => setLocation('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <h1 className="text-lg font-semibold">Conference Coffees</h1>
          <div className="w-12" /> {/* Spacer for alignment */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <Label className="text-lg">Select Your Conferences</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Choose the conferences you'll be attending to connect with other attendees
          </p>

          <div className="grid gap-4">
            {activeEvents.map(event => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{event.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(event.start_date)} - {formatDate(event.end_date)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        📍 {event.city}
                      </div>
                    </div>
                    <Button
                      variant={event.isAttending ? "default" : "outline"}
                      onClick={() => toggleEventAttendance(event.id)}
                      disabled={isSubmitting}
                    >
                      {event.isAttending ? "Attending" : "I'll be there"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}