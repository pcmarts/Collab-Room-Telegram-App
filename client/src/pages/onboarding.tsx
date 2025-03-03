import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { userFormSchema, type UserFormData } from "@shared/schema";

export default function OnboardingForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      handle: "@",
    }
  });

  // Debug: Log Telegram WebApp status
  useEffect(() => {
    console.log('============ DEBUG: Component Mount ============');
    console.log('window.Telegram exists:', !!window.Telegram);
    console.log('window.Telegram?.WebApp exists:', !!window.Telegram?.WebApp);
    if (window.Telegram?.WebApp) {
      console.log('initData:', window.Telegram.WebApp.initData);
    }
  }, []);

  const onSubmit = async (data: UserFormData) => {
    console.log('============ DEBUG: Form Submit Started ============');

    try {
      setIsSubmitting(true);
      console.log('Form data:', data);

      const submitData = {
        ...data,
        initData: window.Telegram?.WebApp?.initData || ''
      };

      console.log('Submitting data:', submitData);

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit form');
      }

      toast({
        title: "Success!",
        description: responseData.message || "Form submitted successfully"
      });

      // Close Telegram WebApp after short delay to show toast
      setTimeout(() => {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.close();
        }
      }, 1500);

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit form"
      });
    } finally {
      setIsSubmitting(false);
      console.log('============ DEBUG: Form Submit Ended ============');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Basic Information</h1>
          <p className="text-muted-foreground mt-2">Tell us about yourself</p>
        </div>

        <div className="text-xs text-muted-foreground mb-4">
          Telegram WebApp: {window.Telegram?.WebApp ? 'Available' : 'Not Available'}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-12" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-12" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram Handle</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="@username"
                      className="h-12"
                      onChange={(e) => {
                        let value = e.target.value;
                        if (!value.startsWith('@')) {
                          value = '@' + value;
                        }
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full h-12 mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}