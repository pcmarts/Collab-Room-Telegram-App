import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { COLLAB_TYPES, insertCollaborationOpportunitySchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export default function CreateOpportunity() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(insertCollaborationOpportunitySchema),
    defaultValues: {
      title: '',
      description: '',
      collab_type: '',
      expires_at: undefined
    }
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const response = await apiRequest('POST', '/api/opportunities', data);
      
      if (!response.ok) {
        throw new Error('Failed to create opportunity');
      }

      toast({
        title: 'Success!',
        description: 'Your collaboration opportunity has been created.',
      });

      setLocation('/collaborations');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create opportunity',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/collaborations')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Collaboration Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter opportunity title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the collaboration opportunity"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collab_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collaboration Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a collaboration type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COLLAB_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Opportunity"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
