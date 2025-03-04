import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FUNDING_STAGES, BLOCKCHAIN_NETWORKS, COMPANY_TAG_CATEGORIES } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";

export default function CompanyInfoForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const queryClient = useQueryClient();

  // Check if we're in edit mode
  const isEditMode = window.location.search.includes('edit=true');

  // Fetch existing data if in edit mode
  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ['/api/profile'],
    enabled: isEditMode,
    staleTime: 0 // Always fetch fresh data
  });

  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    website: 'https://www.',
    twitter_url: 'https://x.com/',
    linkedin_url: '',
    funding_stage: 'Pre-seed',
    has_token: false,
    token_ticker: '$',
    blockchain_networks: [] as string[],
    tags: [] as string[],
    logo_url: ''
  });

  // Load saved data from API or session storage
  useEffect(() => {
    console.log('Loading data, isEditMode:', isEditMode, 'profileData:', profileData);
    if (isEditMode && profileData?.company) {
      console.log('Setting form data from profile:', profileData.company);
      setFormData({
        company_name: profileData.company.name,
        job_title: profileData.company.job_title,
        website: profileData.company.website,
        twitter_url: profileData.company.twitter_handle ? `https://x.com/${profileData.company.twitter_handle}` : 'https://x.com/',
        linkedin_url: profileData.company.linkedin_url || '',
        funding_stage: profileData.company.funding_stage,
        has_token: profileData.company.has_token,
        token_ticker: profileData.company.token_ticker || '$',
        blockchain_networks: profileData.company.blockchain_networks || [],
        tags: profileData.company.tags || [],
        logo_url: profileData.company.logo_url || ''
      });
      if (profileData.company.logo_url) {
        setLogoPreview(profileData.company.logo_url);
      }
    } else if (!isEditMode) {
      const savedData = sessionStorage.getItem('companyFormData');
      if (savedData) {
        console.log('Loading data from session storage:', savedData);
        setFormData(JSON.parse(savedData));
      }
    }
  }, [isEditMode, profileData]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "Error",
          description: "Logo file size must be less than 5MB"
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    if (!isEditMode) {
      sessionStorage.setItem('companyFormData', JSON.stringify(newFormData));
    }
  };

  const toggleTag = (tag: string) => {
    const tags = formData.tags.includes(tag)
      ? formData.tags.filter(t => t !== tag)
      : [...formData.tags, tag];

    const newFormData = {
      ...formData,
      tags
    };
    setFormData(newFormData);
    if (!isEditMode) {
      sessionStorage.setItem('companyFormData', JSON.stringify(newFormData));
    }
  };

  const toggleBlockchain = (network: string) => {
    const networks = formData.blockchain_networks.includes(network)
      ? formData.blockchain_networks.filter(n => n !== network)
      : [...formData.blockchain_networks, network];

    const newFormData = {
      ...formData,
      blockchain_networks: networks
    };
    setFormData(newFormData);
    if (!isEditMode) {
      sessionStorage.setItem('companyFormData', JSON.stringify(newFormData));
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleNext = () => {
    if (!formData.company_name || !formData.job_title || !formData.website || !formData.funding_stage) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    if (formData.has_token && (!formData.token_ticker || formData.blockchain_networks.length === 0)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in token information"
      });
      return;
    }

    if (formData.tags.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one company tag"
      });
      return;
    }

    // Store the form data in session storage
    sessionStorage.setItem('companyFormData', JSON.stringify({
      ...formData,
      twitter_handle: formData.twitter_url.replace('https://x.com/', '').replace('@', '')
    }));

    // Navigate to next step
    setLocation('/collab-preferences');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('============ DEBUG: Company Form Submit Started ============');
    console.log('Current form data:', formData);

    try {
      setIsSubmitting(true);

      if (!formData.company_name || !formData.job_title || !formData.website || !formData.funding_stage) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.has_token && (!formData.token_ticker || formData.blockchain_networks.length === 0)) {
        throw new Error('Please fill in token information');
      }

      if (formData.tags.length === 0) {
        throw new Error('Please select at least one company tag');
      }

      // If there's a new logo file, upload it first
      let logo_url = formData.logo_url;
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const uploadResponse = await apiRequest('POST', '/api/upload-logo', formData);
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Failed to upload logo');
        }
        logo_url = uploadData.url;
      }

      const submitData = {
        company_name: formData.company_name,
        job_title: formData.job_title,
        website: formData.website,
        twitter_handle: formData.twitter_url.replace('https://x.com/', '').replace('@', ''),
        linkedin_url: formData.linkedin_url,
        funding_stage: formData.funding_stage,
        has_token: formData.has_token,
        token_ticker: formData.has_token ? formData.token_ticker : null,
        blockchain_networks: formData.has_token ? formData.blockchain_networks : [],
        tags: formData.tags,
        logo_url
      };

      console.log('Submitting data to API:', submitData);

      const response = await apiRequest('POST', '/api/company', submitData);
      const responseData = await response.json();

      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update company information');
      }

      // Invalidate the profile query to force a refresh
      await queryClient.invalidateQueries({ queryKey: ['/api/profile'] });

      toast({
        title: "Success!",
        description: "Company information updated successfully"
      });

      // Wait for toast to show before navigation
      await new Promise(resolve => setTimeout(resolve, 500));
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
      console.log('============ DEBUG: Company Form Submit Ended ============');
    }
  };

  const handleBack = () => {
    setLocation(isEditMode ? '/dashboard' : '/onboarding');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={handleBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isEditMode ? 'Cancel' : 'Back'}
          </Button>
          {!isEditMode && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/50"></div>
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <div className="w-3 h-3 rounded-full bg-primary/50"></div>
            </div>
          )}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Company Information' : 'Company Information'}
          </h1>
          <p className="text-muted-foreground mt-2">Tell us about your company</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Logo Upload */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg">
              {logoPreview ? (
                <div className="relative w-32 h-32 mb-4">
                  <img
                    src={logoPreview}
                    alt="Company logo preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview('');
                      setFormData(prev => ({ ...prev, logo_url: '' }));
                    }}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Upload your company logo</p>
                  <p className="text-xs text-muted-foreground">(Max 5MB)</p>
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="mt-4"
              />
            </div>
          </div>

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
            <Label htmlFor="twitter_url">Company Twitter URL</Label>
            <Input
              id="twitter_url"
              name="twitter_url"
              value={formData.twitter_url}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="linkedin_url">Company LinkedIn URL</Label>
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
                  required
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
            <Label className="text-lg">Company Tags</Label>
            <p className="text-sm text-muted-foreground">
              Select tags that best describe your company's focus areas
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

          <Button
            type="submit"
            className="w-full mt-6"
            onClick={isEditMode ? handleSubmit : handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? 'Saving...' : 'Next'}
              </>
            ) : (
              isEditMode ? "Save Changes" : "Continue to Preferences"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}