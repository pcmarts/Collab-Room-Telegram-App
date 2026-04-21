import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { Switch } from "@/components/ui/switch";
import {
  FUNDING_STAGES,
  BLOCKCHAIN_NETWORK_CATEGORIES,
  COMPANY_TAG_CATEGORIES,
  TWITTER_FOLLOWER_COUNTS,
} from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProfileData } from "@/types/profile";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { FixedBottomButton } from "@/components/ui/FixedBottomButton";
import { Eyebrow } from "@/components/brand";

export default function CompanyInfoForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalHeight = document.body.style.height;

    document.body.style.overflow = "auto";
    document.body.style.position = "static";
    document.body.style.width = "auto";
    document.body.style.height = "auto";
    document.documentElement.classList.add("scrollable-page");
    document.body.classList.add("scrollable-page");

    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.style.overflow = "auto";
      rootElement.style.height = "auto";
      rootElement.style.position = "static";
      rootElement.style.width = "100%";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.height = originalHeight;
      document.documentElement.classList.remove("scrollable-page");
      document.body.classList.remove("scrollable-page");
      if (rootElement) {
        rootElement.style.overflow = "";
        rootElement.style.height = "";
        rootElement.style.position = "";
        rootElement.style.width = "";
      }
    };
  }, []);

  const { data: profileData, isLoading } = useQuery<ProfileData>({
    queryKey: ["/api/profile"],
  });

  const [formData, setFormData] = useState({
    company_name: "",
    job_title: "",
    website: "",
    twitter_url: "",
    twitter_followers: "",
    linkedin_url: "",
    funding_stage: "",
    has_token: false,
    token_ticker: "$",
    blockchain_networks: [] as string[],
    tags: [] as string[],
    short_description: "",
    long_description: "",
  });

  useEffect(() => {
    if (profileData?.company) {
      setFormData({
        company_name: profileData.company.name,
        job_title: profileData.company.job_title,
        website: profileData.company.website,
        twitter_url: profileData.company.twitter_handle
          ? `https://x.com/${profileData.company.twitter_handle}`
          : "",
        twitter_followers: profileData.company.twitter_followers || "",
        linkedin_url: profileData.company.linkedin_url || "",
        funding_stage: profileData.company.funding_stage || "",
        has_token: profileData.company.has_token || false,
        token_ticker: profileData.company.token_ticker || "$",
        blockchain_networks: profileData.company.blockchain_networks || [],
        tags: profileData.company.tags || [],
        short_description: profileData.company.short_description || "",
        long_description: profileData.company.long_description || "",
      });
    }
  }, [profileData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const toggleBlockchain = (network: string) => {
    setFormData((prev) => ({
      ...prev,
      blockchain_networks: prev.blockchain_networks.includes(network)
        ? prev.blockchain_networks.filter((n) => n !== network)
        : [...prev.blockchain_networks, network],
    }));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setIsSubmitting(true);
      const submitData = {
        company_name: formData.company_name,
        job_title: formData.job_title,
        website: formData.website,
        twitter_handle: formData.twitter_url
          .replace("https://x.com/", "")
          .replace("@", ""),
        twitter_followers: formData.twitter_followers,
        linkedin_url: formData.linkedin_url,
        funding_stage: formData.funding_stage,
        has_token: formData.has_token,
        token_ticker: formData.has_token ? formData.token_ticker : null,
        blockchain_networks: formData.has_token
          ? formData.blockchain_networks
          : [],
        tags: formData.tags,
        short_description: formData.short_description,
        long_description: formData.long_description,
      };
      await apiRequest("/api/company", "POST", submitData);
      await queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Saved", description: "Company info updated." });
      setLocation("/discover");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-text-subtle" />
      </div>
    );
  }

  const renderExpandableSelectors = (
    categories: Record<string, readonly string[]>,
    selected: string[],
    onToggle: (v: string) => void
  ) =>
    Object.entries(categories).map(([category, items]) => {
      const count = selected.filter((v) => (items as readonly string[]).includes(v)).length;
      const isOpen = expandedCategories.includes(category);
      return (
        <div
          key={category}
          className="overflow-hidden rounded-md border border-hairline"
        >
          <button
            type="button"
            onClick={() => toggleCategory(category)}
            className="flex w-full items-center justify-between px-3 py-3 text-left transition-colors duration-fast ease-out hover:bg-surface"
          >
            <span className="text-sm font-medium text-text">{category}</span>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <span className="rounded-full bg-brand-subtle px-2 py-0.5 text-xs font-medium tabular text-brand">
                  {count}
                </span>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-text-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-muted" />
              )}
            </div>
          </button>
          {isOpen && (
            <div className="border-t border-hairline p-2">
              <div className="flex flex-wrap gap-1.5">
                {(items as readonly string[]).map((item) => {
                  const isSelected = selected.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onToggle(item)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-fast ease-out ${
                        isSelected
                          ? "bg-brand text-brand-fg"
                          : "border border-hairline text-text-muted hover:text-text"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="min-h-[100svh] bg-background pb-28">
      <PageHeader title="Company info" showBackButton backUrl="/dashboard" />

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-md space-y-5 px-6 pt-6"
      >
        <Eyebrow tone="muted">Company details</Eyebrow>

        <div>
          <Label htmlFor="company_name">Company name</Label>
          <Input
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="job_title">Your role</Label>
          <Input
            id="job_title"
            name="job_title"
            value={formData.job_title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="short_description">Short description</Label>
          <Textarea
            id="short_description"
            name="short_description"
            value={formData.short_description}
            onChange={handleInputChange}
            placeholder="One-line pitch"
            className="resize-none"
            maxLength={150}
          />
          <div className="mt-1 text-right text-xs tabular text-text-subtle">
            {formData.short_description.length}/150
          </div>
        </div>

        <div>
          <Label htmlFor="long_description">Long description</Label>
          <Textarea
            id="long_description"
            name="long_description"
            value={formData.long_description}
            onChange={handleInputChange}
            placeholder="What you do, for whom, why it matters."
            className="resize-none"
            rows={5}
            maxLength={1000}
          />
          <div className="mt-1 text-right text-xs tabular text-text-subtle">
            {formData.long_description.length}/1000
          </div>
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
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
          <Label htmlFor="twitter_url">Twitter</Label>
          <Input
            id="twitter_url"
            name="twitter_url"
            value={formData.twitter_url}
            onChange={handleInputChange}
            placeholder="https://x.com/…"
          />
        </div>

        <div>
          <Label htmlFor="twitter_followers">Twitter followers</Label>
          <Select
            value={formData.twitter_followers}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, twitter_followers: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {TWITTER_FOLLOWER_COUNTS.map((count) => (
                <SelectItem key={count} value={count}>
                  {count}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="linkedin_url">LinkedIn</Label>
          <Input
            id="linkedin_url"
            name="linkedin_url"
            type="url"
            value={formData.linkedin_url}
            onChange={handleInputChange}
            placeholder="https://linkedin.com/company/…"
          />
        </div>

        <div>
          <Label htmlFor="funding_stage">Funding stage</Label>
          <Select
            value={formData.funding_stage}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, funding_stage: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {FUNDING_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4">
          <Eyebrow tone="muted" className="mb-2">Positioning</Eyebrow>
          <Label>Sectors</Label>
          <p className="mb-3 text-sm text-text-muted">
            Pick what describes your company.
          </p>
          <div className="space-y-2">
            {renderExpandableSelectors(
              COMPANY_TAG_CATEGORIES as Record<string, readonly string[]>,
              formData.tags,
              toggleTag
            )}
          </div>
        </div>

        <div className="pt-4">
          <Eyebrow tone="muted" className="mb-2">Token</Eyebrow>
          <div className="flex items-center justify-between rounded-md border border-hairline bg-surface px-3 py-3">
            <Label htmlFor="has_token" className="mb-0">
              Live token
            </Label>
            <Switch
              id="has_token"
              checked={formData.has_token}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, has_token: checked }))
              }
            />
          </div>
        </div>

        {formData.has_token && (
          <>
            <div>
              <Label htmlFor="token_ticker">Token ticker</Label>
              <Input
                id="token_ticker"
                name="token_ticker"
                value={formData.token_ticker}
                onChange={handleInputChange}
                required={formData.has_token}
              />
            </div>

            <div>
              <Label>Blockchain networks</Label>
              <p className="mb-3 text-sm text-text-muted">
                Where the token is deployed.
              </p>
              <div className="space-y-2">
                {renderExpandableSelectors(
                  BLOCKCHAIN_NETWORK_CATEGORIES as Record<string, readonly string[]>,
                  formData.blockchain_networks,
                  toggleBlockchain
                )}
              </div>
            </div>
          </>
        )}
      </form>

      <FixedBottomButton
        type="button"
        onClick={() => handleSubmit()}
        isLoading={isSubmitting}
        loadingText="Saving…"
        text="Save changes"
      />
    </div>
  );
}
