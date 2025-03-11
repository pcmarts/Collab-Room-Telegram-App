import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { Switch } from "@/components/ui/switch";
import { FUNDING_STAGES, BLOCKCHAIN_NETWORKS, COMPANY_TAG_CATEGORIES, TWITTER_FOLLOWER_COUNTS } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";

export default function CompanyInfoForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch existing data
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile']
  });

  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    website: '',
    twitter_url: '',
    twitter_followers: '',
    linkedin_url: '',
    funding_stage: '',
    has_token: false,
    token_ticker: '$',
    blockchain_networks: [] as string[],
    tags: [] as string[],
    short_description: '',
    long_description: ''
  });

  // Load data when available
  useEffect(() => {
    if (profileData?.company) {
      setFormData({
        company_name: profileData.company.name,
        job_title: profileData.company.job_title,
        website: profileData.company.website,
        twitter_url: profileData.company.twitter_handle ? `https://x.com/${profileData.company.twitter_handle}` : '',
        twitter_followers: profileData.company.twitter_followers || '',
        linkedin_url: profileData.company.linkedin_url || '',
        funding_stage: profileData.company.funding_stage,
        has_token: profileData.company.has_token || false,
        token_ticker: profileData.company.token_ticker || '$',
        blockchain_networks: profileData.company.blockchain_networks || [],
        tags: profileData.company.tags || [],
        short_description: profileData.company.short_description || '',
        long_description: profileData.company.long_description || ''
      });
    }
  }, [profileData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleBlockchain = (network: string) => {
    setFormData(prev => ({
      ...prev,
      blockchain_networks: prev.blockchain_networks.includes(network)
        ? prev.blockchain_networks.filter(n => n !== network)
        : [...prev.blockchain_networks, network]
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const submitData = {
        company_name: formData.company_name,
        job_title: formData.job_title,
        website: formData.website,
        twitter_handle: formData.twitter_url.replace('https://x.com/', '').replace('@', ''),
        twitter_followers: formData.twitter_followers,
        linkedin_url: formData.linkedin_url,
        funding_stage: formData.funding_stage,
        has_token: formData.has_token,
        token_ticker: formData.has_token ? formData.token_ticker : null,
        blockchain_networks: formData.has_token ? formData.blockchain_networks : [],
        tags: formData.tags,
        short_description: formData.short_description,
        long_description: formData.long_description
      };

      const response = await apiRequest('/api/company', 'POST', submitData);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update company information');
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/profile'] });

      toast({
        title: "Success!",
        description: "Company information updated successfully",
        duration: 2000
      });

      setLocation('/dashboard');

    } catch (error) {
      console.error('Failed to update company info:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update company information"
      });
    } finally {
      setIsSubmitting(false);
    }
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
        title="My Company"
        subtitle="Manage your company details"
        backUrl="/dashboard"
      />

      <div className="p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4 pb-24">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="job_title">Your Job Title / Role</Label>
            <Input
              id="job_title"
              name="job_title"
              value={formData.job_title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="short_description">Short Description</Label>
            <div className="mt-1.5">
              <Textarea
                id="short_description"
                name="short_description"
                value={formData.short_description}
                onChange={handleInputChange}
                placeholder="A brief tagline or elevator pitch for your company"
                className="resize-none"
                maxLength={150}
              />
              <div className="text-sm text-muted-foreground text-right mt-1">
                {formData.short_description.length}/150
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="long_description">Long Description</Label>
            <div className="mt-1.5">
              <Textarea
                id="long_description"
                name="long_description"
                value={formData.long_description}
                onChange={handleInputChange}
                placeholder="A detailed description of your company, its mission, and what makes it unique"
                className="resize-none"
                rows={5}
                maxLength={1000}
              />
              <div className="text-sm text-muted-foreground text-right mt-1">
                {formData.long_description.length}/1000
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="website">Company Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="twitter_url">Twitter URL</Label>
            <Input
              id="twitter_url"
              name="twitter_url"
              value={formData.twitter_url}
              onChange={handleInputChange}
              placeholder="https://x.com/..."
            />
          </div>

          <div>
            <Label htmlFor="twitter_followers">Twitter Follower Count</Label>
            <Select
              value={formData.twitter_followers}
              onValueChange={(value) => setFormData(prev => ({ ...prev, twitter_followers: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select follower count range" />
              </SelectTrigger>
              <SelectContent>
                {TWITTER_FOLLOWER_COUNTS.map(count => (
                  <SelectItem key={count} value={count}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/company/..."
            />
          </div>

          <div>
            <Label htmlFor="funding_stage">Company Funding Stage</Label>
            <Select
              value={formData.funding_stage}
              onValueChange={(value) => setFormData(prev => ({ ...prev, funding_stage: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select funding stage" />
              </SelectTrigger>
              <SelectContent>
                {FUNDING_STAGES.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="has_token"
                checked={formData.has_token}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_token: checked }))}
              />
              <Label htmlFor="has_token">Live Token?</Label>
            </div>
          </div>

          {formData.has_token && (
            <>
              <div>
                <Label htmlFor="token_ticker">Token Ticker</Label>
                <Input
                  id="token_ticker"
                  name="token_ticker"
                  value={formData.token_ticker}
                  onChange={handleInputChange}
                  required={formData.has_token}
                />
              </div>

              <div className="space-y-2">
                <Label>Blockchain Networks</Label>
                <div className="grid grid-cols-1 gap-2">
                  {BLOCKCHAIN_NETWORKS.map(network => (
                    <Button
                      key={network}
                      type="button"
                      variant={formData.blockchain_networks.includes(network) ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => toggleBlockchain(network)}
                    >
                      {network}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-4 pt-4">
            <Label className="text-lg">Your Company Sector</Label>
            <p className="text-sm text-muted-foreground">
              Select tags that best describe your company's focus areas in web3.
            </p>

            {Object.entries(COMPANY_TAG_CATEGORIES).map(([category, tags]) => (
              <div key={category} className="border rounded-lg overflow-hidden">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full flex justify-between items-center p-4"
                  onClick={() => toggleCategory(category)}
                >
                  <span className="font-medium">{category}</span>
                  {expandedCategories.includes(category) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {expandedCategories.includes(category) && (
                  <div className="p-4 pt-0 grid grid-cols-1 gap-2">
                    {tags.map(tag => (
                      <Button
                        key={tag}
                        type="button"
                        variant={formData.tags.includes(tag) ? "default" : "outline"}
                        className="justify-start h-auto py-3 px-4"
                        onClick={() => toggleTag(tag)}
                      >
                        <span className="text-left">{tag}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Floating Save Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-lg">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}