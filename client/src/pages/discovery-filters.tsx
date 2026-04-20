import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";

import { MobileCheck } from "@/components/MobileCheck";
import { PageHeader } from "@/components/layout/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FixedBottomButton } from "@/components/ui/FixedBottomButton";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  COLLAB_TYPES,
  COLLAB_TOPICS,
  COMPANY_TAG_CATEGORIES,
  BLOCKCHAIN_NETWORK_CATEGORIES,
  TWITTER_FOLLOWER_COUNTS,
  FUNDING_STAGES,
} from "@shared/schema";

const filterFormSchema = z.object({
  collabTypes: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  companySectors: z.array(z.string()).default([]),
  companyFollowers: z.string().optional(),
  userFollowers: z.string().optional(),
  fundingStages: z.array(z.string()).default([]),
  hasToken: z.boolean().default(false),
  blockchainNetworks: z.array(z.string()).default([]),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

type FilterKey = keyof Omit<FilterFormValues, never>;

const FILTER_LABELS: { key: FilterKey; label: string; hint: string }[] = [
  {
    key: "collabTypes",
    label: "Collab type",
    hint: "Spaces, podcasts, co-marketing, newsletters…",
  },
  { key: "topics", label: "Topics", hint: "What the collab is about" },
  { key: "companySectors", label: "Sectors", hint: "DeFi, infra, gaming, L2s…" },
  {
    key: "blockchainNetworks",
    label: "Chains",
    hint: "What chains the company supports",
  },
  {
    key: "companyFollowers",
    label: "Company reach",
    hint: "Minimum Twitter followers for the company",
  },
  {
    key: "userFollowers",
    label: "Personal reach",
    hint: "Minimum Twitter followers for the host",
  },
  { key: "fundingStages", label: "Funding stage", hint: "Seed, Series A, etc." },
  { key: "hasToken", label: "Has token", hint: "Only show companies with a live token" },
];

export default function DiscoveryFilters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isSaving, setIsSaving] = useState(false);

  const [enabled, setEnabled] = useState<Record<FilterKey, boolean>>({
    collabTypes: false,
    topics: false,
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false,
    blockchainNetworks: false,
  });

  const [expanded, setExpanded] = useState<Record<FilterKey, boolean>>({
    collabTypes: false,
    topics: false,
    companySectors: false,
    companyFollowers: false,
    userFollowers: false,
    fundingStages: false,
    hasToken: false,
    blockchainNetworks: false,
  });

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      collabTypes: [],
      topics: [],
      companySectors: [],
      companyFollowers: undefined,
      userFollowers: undefined,
      fundingStages: [],
      hasToken: false,
      blockchainNetworks: [],
    },
  });

  interface MarketingPreferencesResponse {
    collabs_to_discover?: string[];
    filtered_marketing_topics?: string[];
    company_tags?: string[];
    twitter_followers?: string;
    company_twitter_followers?: string;
    funding_stage?: string;
    company_has_token?: boolean;
    company_blockchain_networks?: string[];
    discovery_filter_collab_types_enabled?: boolean;
    discovery_filter_topics_enabled?: boolean;
    discovery_filter_company_followers_enabled?: boolean;
    discovery_filter_user_followers_enabled?: boolean;
    discovery_filter_funding_stages_enabled?: boolean;
    discovery_filter_token_status_enabled?: boolean;
    discovery_filter_company_sectors_enabled?: boolean;
    discovery_filter_blockchain_networks_enabled?: boolean;
  }

  const { data: marketingPrefs = {} as MarketingPreferencesResponse } =
    useQuery<MarketingPreferencesResponse>({
      queryKey: ["/api/marketing-preferences"],
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  const preloaded = useMemo(() => {
    if (!marketingPrefs) return null;
    return {
      values: {
        collabTypes: marketingPrefs.collabs_to_discover || [],
        topics: marketingPrefs.filtered_marketing_topics || [],
        companySectors: marketingPrefs.company_tags || [],
        companyFollowers: marketingPrefs.company_twitter_followers,
        userFollowers: marketingPrefs.twitter_followers,
        fundingStages: marketingPrefs.funding_stage
          ? marketingPrefs.funding_stage.split(",")
          : [],
        hasToken: marketingPrefs.company_has_token === true,
        blockchainNetworks: marketingPrefs.company_blockchain_networks || [],
      },
      enabled: {
        collabTypes: !!marketingPrefs.discovery_filter_collab_types_enabled,
        topics: !!marketingPrefs.discovery_filter_topics_enabled,
        companySectors: !!marketingPrefs.discovery_filter_company_sectors_enabled,
        companyFollowers:
          !!marketingPrefs.discovery_filter_company_followers_enabled,
        userFollowers:
          !!marketingPrefs.discovery_filter_user_followers_enabled,
        fundingStages:
          !!marketingPrefs.discovery_filter_funding_stages_enabled,
        hasToken: !!marketingPrefs.discovery_filter_token_status_enabled,
        blockchainNetworks:
          !!marketingPrefs.discovery_filter_blockchain_networks_enabled,
      },
    };
  }, [marketingPrefs]);

  useEffect(() => {
    if (preloaded) {
      form.reset(preloaded.values);
      setEnabled(preloaded.enabled);
      setExpanded(preloaded.enabled);
    }
  }, [preloaded, form]);

  useEffect(() => {
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
      document.documentElement.classList.remove("scrollable-page");
      document.body.classList.remove("scrollable-page");
      if (rootElement) {
        rootElement.style.removeProperty("overflow");
        rootElement.style.removeProperty("height");
        rootElement.style.removeProperty("position");
        rootElement.style.removeProperty("width");
      }
    };
  }, []);

  const toggleExpanded = (key: FilterKey) => {
    const nextOpen = !expanded[key];
    setExpanded((prev) => ({ ...prev, [key]: nextOpen }));
    if (nextOpen) setEnabled((prev) => ({ ...prev, [key]: true }));
  };

  const toggleCategory = (cat: string) =>
    setExpandedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const activeCount = () => Object.values(enabled).filter(Boolean).length;

  const savePreferences = async (values: FilterFormValues) => {
    const data = {
      collabs_to_discover: values.collabTypes,
      filtered_marketing_topics: values.topics,
      company_tags: values.companySectors,
      company_blockchain_networks: values.blockchainNetworks,
      company_twitter_followers: enabled.companyFollowers
        ? values.companyFollowers
        : null,
      twitter_followers: enabled.userFollowers ? values.userFollowers : null,
      funding_stage:
        enabled.fundingStages && values.fundingStages.length > 0
          ? values.fundingStages.join(",")
          : null,
      company_has_token: enabled.hasToken ? values.hasToken : null,
      discovery_filter_enabled: Object.values(enabled).some((v) => v),
      discovery_filter_collab_types_enabled: enabled.collabTypes,
      discovery_filter_topics_enabled: enabled.topics,
      discovery_filter_company_sectors_enabled: enabled.companySectors,
      discovery_filter_company_followers_enabled: enabled.companyFollowers,
      discovery_filter_user_followers_enabled: enabled.userFollowers,
      discovery_filter_funding_stages_enabled: enabled.fundingStages,
      discovery_filter_token_status_enabled: enabled.hasToken,
      discovery_filter_blockchain_networks_enabled: enabled.blockchainNetworks,
    };
    await apiRequest("/api/marketing-preferences", "POST", data);
    queryClient.removeQueries({ queryKey: ["/api/marketing-preferences"] });
    await queryClient.fetchQuery({
      queryKey: ["/api/marketing-preferences"],
      staleTime: 0,
    });
  };

  const onSubmit = async (values: FilterFormValues) => {
    setIsSaving(true);
    try {
      await savePreferences(values);
      toast({
        title: "Filters saved",
        description: "Your feed is tighter now.",
      });
      navigate("/discover");
    } catch {
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description: "Try again in a moment.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = () => {
    form.reset({
      collabTypes: [],
      topics: [],
      companySectors: [],
      companyFollowers: undefined,
      userFollowers: undefined,
      fundingStages: [],
      hasToken: false,
      blockchainNetworks: [],
    });
    setEnabled({
      collabTypes: false,
      topics: false,
      companySectors: false,
      companyFollowers: false,
      userFollowers: false,
      fundingStages: false,
      hasToken: false,
      blockchainNetworks: false,
    });
    setExpanded({
      collabTypes: false,
      topics: false,
      companySectors: false,
      companyFollowers: false,
      userFollowers: false,
      fundingStages: false,
      hasToken: false,
      blockchainNetworks: false,
    });
  };

  return (
    <MobileCheck>
      <div className="min-h-[100svh] bg-background pb-28">
        <PageHeader
          title="Filters"
          subtitle={
            activeCount() > 0
              ? `${activeCount()} active`
              : "Tighten your feed."
          }
          backUrl="/discover"
          trailing={
            activeCount() > 0 ? (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm font-medium text-text-muted hover:text-text"
              >
                Clear all
              </button>
            ) : undefined
          }
        />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mx-auto max-w-xl"
          >
            {FILTER_LABELS.map(({ key, label, hint }) => (
              <FilterSection
                key={key}
                label={label}
                hint={hint}
                enabled={enabled[key]}
                expanded={expanded[key]}
                onToggleEnabled={(v) =>
                  setEnabled((prev) => ({ ...prev, [key]: v }))
                }
                onToggleExpanded={() => toggleExpanded(key)}
              >
                <FilterBody
                  filterKey={key}
                  form={form}
                  enabled={enabled[key]}
                  expandedCategories={expandedCategories}
                  onToggleCategory={toggleCategory}
                />
              </FilterSection>
            ))}
          </form>
        </Form>

        <FixedBottomButton
          type="button"
          onClick={() => form.handleSubmit(onSubmit)()}
          isLoading={isSaving}
          loadingText="Saving…"
          text="Apply filters"
        />
      </div>
    </MobileCheck>
  );
}

function FilterSection({
  label,
  hint,
  enabled,
  expanded,
  onToggleEnabled,
  onToggleExpanded,
  children,
}: {
  label: string;
  hint: string;
  enabled: boolean;
  expanded: boolean;
  onToggleEnabled: (v: boolean) => void;
  onToggleExpanded: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-hairline">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors duration-fast ease-out active:bg-surface"
      >
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-text">{label}</p>
          <p className="truncate text-sm text-text-muted">{hint}</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => {
            onToggleEnabled(v);
            if (v) onToggleExpanded();
          }}
          onClick={(e) => e.stopPropagation()}
        />
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-text-subtle" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-subtle" />
        )}
      </button>
      {expanded && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function FilterBody({
  filterKey,
  form,
  enabled,
  expandedCategories,
  onToggleCategory,
}: {
  filterKey: FilterKey;
  form: any;
  enabled: boolean;
  expandedCategories: string[];
  onToggleCategory: (category: string) => void;
}) {
  const renderFlatList = (
    name: FilterKey,
    items: readonly string[]
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {items.map((item) => (
              <FormItem
                key={item}
                className="flex items-center gap-2 space-y-0"
              >
                <FormControl>
                  <Checkbox
                    disabled={!enabled}
                    checked={field.value?.includes(item)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...(field.value || []), item]
                        : (field.value || []).filter((v: string) => v !== item);
                      field.onChange(next);
                    }}
                  />
                </FormControl>
                <FormLabel className="mb-0 font-normal text-text">
                  {item}
                </FormLabel>
              </FormItem>
            ))}
          </div>
        </FormItem>
      )}
    />
  );

  const renderCategorized = (
    name: FilterKey,
    categories: Record<string, readonly string[]>
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="space-y-2">
            {Object.entries(categories).map(([category, items]) => {
              const isOpen = expandedCategories.includes(category);
              const count = (field.value || []).filter((v: string) =>
                (items as readonly string[]).includes(v)
              ).length;
              return (
                <div
                  key={category}
                  className="overflow-hidden rounded-md border border-hairline"
                >
                  <button
                    type="button"
                    onClick={() => onToggleCategory(category)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors duration-fast ease-out hover:bg-surface"
                  >
                    <span className="text-sm font-medium text-text">
                      {category}
                    </span>
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
                          const selected = (field.value || []).includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              disabled={!enabled}
                              onClick={() =>
                                field.onChange(
                                  selected
                                    ? (field.value || []).filter(
                                        (v: string) => v !== item
                                      )
                                    : [...(field.value || []), item]
                                )
                              }
                              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-fast ease-out ${
                                selected
                                  ? "bg-brand text-brand-fg"
                                  : "border border-hairline text-text-muted hover:text-text"
                              } ${!enabled ? "opacity-50" : ""}`}
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
            })}
          </div>
        </FormItem>
      )}
    />
  );

  const renderSelect = (name: FilterKey) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <Select
          disabled={!enabled}
          value={field.value}
          onValueChange={field.onChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a range" />
          </SelectTrigger>
          <SelectContent>
            {TWITTER_FOLLOWER_COUNTS.map((count) => (
              <SelectItem key={count} value={count}>
                {count}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  const renderTokenSwitch = () => (
    <FormField
      control={form.control}
      name="hasToken"
      render={({ field }) => (
        <div className="flex items-center gap-3">
          <Switch
            disabled={!enabled}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
          <FormLabel className="mb-0 font-normal text-text">
            Only show companies with a live token
          </FormLabel>
        </div>
      )}
    />
  );

  switch (filterKey) {
    case "collabTypes":
      return renderFlatList("collabTypes", COLLAB_TYPES);
    case "topics":
      return renderFlatList("topics", COLLAB_TOPICS);
    case "fundingStages":
      return renderFlatList("fundingStages", FUNDING_STAGES);
    case "companySectors":
      return renderCategorized(
        "companySectors",
        COMPANY_TAG_CATEGORIES as Record<string, readonly string[]>
      );
    case "blockchainNetworks":
      return renderCategorized(
        "blockchainNetworks",
        BLOCKCHAIN_NETWORK_CATEGORIES as Record<string, readonly string[]>
      );
    case "companyFollowers":
      return renderSelect("companyFollowers");
    case "userFollowers":
      return renderSelect("userFollowers");
    case "hasToken":
      return renderTokenSwitch();
    default:
      return null;
  }
}
