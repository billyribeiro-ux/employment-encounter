"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import {
  useCareerPage,
  useUpdateCareerPage,
  usePublishCareerPage,
  type CareerPageConfig,
} from "@/lib/hooks/use-career-page";
import { toast } from "sonner";
import {
  Globe,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Link,
  Palette,
  Search,
  Image,
  MapPin,
  Quote,
  Users,
  Briefcase,
  Heart,
  Code,
  ExternalLink,
  Check,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMMON_BENEFITS = [
  "Health Insurance",
  "Dental Insurance",
  "Vision Insurance",
  "401(k) Match",
  "Unlimited PTO",
  "Remote Work",
  "Flexible Hours",
  "Gym Membership",
  "Learning Budget",
  "Stock Options",
  "Parental Leave",
  "Mental Health Support",
  "Free Lunch",
  "Company Retreats",
  "Home Office Stipend",
  "Commuter Benefits",
  "Pet-Friendly Office",
  "Wellness Programs",
];

const DEFAULT_CONFIG: Omit<CareerPageConfig, "id" | "tenant_id" | "updated_at"> = {
  is_published: false,
  hero_headline: "Join Our Team",
  hero_subheadline: "Build the future with us. We are hiring talented people who want to make an impact.",
  hero_bg_color: "#1e40af",
  about_text: "We are a passionate team dedicated to building great products that make a difference.",
  mission: "Our mission is to empower organizations with innovative solutions that drive growth and success.",
  values: ["Innovation", "Collaboration", "Integrity", "Excellence"],
  benefits: ["Health Insurance", "401(k) Match", "Remote Work", "Unlimited PTO"],
  culture_description: "We foster a culture of continuous learning, open communication, and mutual respect. Our team thrives on collaboration and creativity.",
  testimonials: [
    {
      name: "Sarah Johnson",
      role: "Senior Engineer",
      quote: "This is the best team I have ever worked with. The culture of innovation and support is unmatched.",
    },
    {
      name: "Mike Chen",
      role: "Product Manager",
      quote: "I love that we have the freedom to take ownership of projects and see them through from idea to launch.",
    },
  ],
  primary_color: "#1e40af",
  accent_color: "#f59e0b",
  logo_url: null,
  meta_title: "Careers - Join Our Team",
  meta_description: "Explore career opportunities and join our team. We offer competitive compensation, great benefits, and an amazing work culture.",
  custom_css: "",
};

// ---------------------------------------------------------------------------
// Section Editor Components
// ---------------------------------------------------------------------------

function HeroSection({
  config,
  onChange,
}: {
  config: typeof DEFAULT_CONFIG;
  onChange: (updates: Partial<typeof DEFAULT_CONFIG>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="hero-headline">Headline</Label>
        <Input
          id="hero-headline"
          value={config.hero_headline}
          onChange={(e) => onChange({ hero_headline: e.target.value })}
          placeholder="Join Our Team"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hero-sub">Subheadline</Label>
        <Textarea
          id="hero-sub"
          value={config.hero_subheadline}
          onChange={(e) => onChange({ hero_subheadline: e.target.value })}
          placeholder="Build the future with us..."
          className="min-h-[80px]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hero-bg">Background Color</Label>
        <div className="flex gap-2">
          <Input
            id="hero-bg"
            type="color"
            value={config.hero_bg_color}
            onChange={(e) => onChange({ hero_bg_color: e.target.value })}
            className="w-12 h-9 p-1 cursor-pointer"
          />
          <Input
            value={config.hero_bg_color}
            onChange={(e) => onChange({ hero_bg_color: e.target.value })}
            placeholder="#1e40af"
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

function AboutSection({
  config,
  onChange,
}: {
  config: typeof DEFAULT_CONFIG;
  onChange: (updates: Partial<typeof DEFAULT_CONFIG>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="about-text">Company Description</Label>
        <Textarea
          id="about-text"
          value={config.about_text}
          onChange={(e) => onChange({ about_text: e.target.value })}
          placeholder="Tell candidates about your company..."
          className="min-h-[100px]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mission">Mission Statement</Label>
        <Textarea
          id="mission"
          value={config.mission}
          onChange={(e) => onChange({ mission: e.target.value })}
          placeholder="What is your company's mission?"
          className="min-h-[80px]"
        />
      </div>
      <div className="space-y-2">
        <Label>Company Values</Label>
        <div className="space-y-2">
          {config.values.map((value, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={value}
                onChange={(e) => {
                  const updated = [...config.values];
                  updated[i] = e.target.value;
                  onChange({ values: updated });
                }}
                placeholder="e.g. Innovation"
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  onChange({
                    values: config.values.filter((_, idx) => idx !== i),
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange({ values: [...config.values, ""] })}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Value
          </Button>
        </div>
      </div>
    </div>
  );
}

function BenefitsSection({
  config,
  onChange,
}: {
  config: typeof DEFAULT_CONFIG;
  onChange: (updates: Partial<typeof DEFAULT_CONFIG>) => void;
}) {
  const [customBenefit, setCustomBenefit] = useState("");

  function toggleBenefit(benefit: string) {
    if (config.benefits.includes(benefit)) {
      onChange({ benefits: config.benefits.filter((b) => b !== benefit) });
    } else {
      onChange({ benefits: [...config.benefits, benefit] });
    }
  }

  function addCustomBenefit() {
    if (customBenefit.trim() && !config.benefits.includes(customBenefit.trim())) {
      onChange({ benefits: [...config.benefits, customBenefit.trim()] });
      setCustomBenefit("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Common Benefits & Perks</Label>
        <div className="grid grid-cols-2 gap-2">
          {COMMON_BENEFITS.map((benefit) => (
            <label
              key={benefit}
              className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2 hover:bg-accent transition-colors"
            >
              <input
                type="checkbox"
                checked={config.benefits.includes(benefit)}
                onChange={() => toggleBenefit(benefit)}
                className="rounded"
              />
              {benefit}
            </label>
          ))}
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label>Custom Benefits</Label>
        <div className="flex gap-2">
          <Input
            value={customBenefit}
            onChange={(e) => setCustomBenefit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomBenefit();
              }
            }}
            placeholder="Add a custom benefit..."
          />
          <Button variant="outline" onClick={addCustomBenefit}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {config.benefits
            .filter((b) => !COMMON_BENEFITS.includes(b))
            .map((benefit) => (
              <Badge
                key={benefit}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => toggleBenefit(benefit)}
              >
                {benefit}
                <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
        </div>
      </div>
    </div>
  );
}

function CultureSection({
  config,
  onChange,
}: {
  config: typeof DEFAULT_CONFIG;
  onChange: (updates: Partial<typeof DEFAULT_CONFIG>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="culture-desc">Culture Description</Label>
        <Textarea
          id="culture-desc"
          value={config.culture_description}
          onChange={(e) => onChange({ culture_description: e.target.value })}
          placeholder="Describe your team culture..."
          className="min-h-[120px]"
        />
      </div>
      <div className="space-y-2">
        <Label>Team Photos</Label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
            >
              <Image className="h-6 w-6 mb-1" />
              <span className="text-[10px]">Upload Photo</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Recommended size: 800x600px. JPG or PNG.
        </p>
      </div>
    </div>
  );
}

function TestimonialsSection({
  config,
  onChange,
}: {
  config: typeof DEFAULT_CONFIG;
  onChange: (updates: Partial<typeof DEFAULT_CONFIG>) => void;
}) {
  function updateTestimonial(
    index: number,
    field: "name" | "role" | "quote",
    value: string
  ) {
    const updated = [...config.testimonials];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ testimonials: updated });
  }

  function removeTestimonial(index: number) {
    onChange({
      testimonials: config.testimonials.filter((_, i) => i !== index),
    });
  }

  function addTestimonial() {
    onChange({
      testimonials: [
        ...config.testimonials,
        { name: "", role: "", quote: "" },
      ],
    });
  }

  return (
    <div className="space-y-4">
      {config.testimonials.map((testimonial, i) => (
        <Card key={i}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Testimonial {i + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeTestimonial(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input
                  value={testimonial.name}
                  onChange={(e) => updateTestimonial(i, "name", e.target.value)}
                  placeholder="Employee name"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <Input
                  value={testimonial.role}
                  onChange={(e) => updateTestimonial(i, "role", e.target.value)}
                  placeholder="Job title"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quote</Label>
              <Textarea
                value={testimonial.quote}
                onChange={(e) => updateTestimonial(i, "quote", e.target.value)}
                placeholder="What do they say about working here?"
                className="min-h-[60px]"
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button variant="outline" onClick={addTestimonial} className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Testimonial
      </Button>
    </div>
  );
}

function ThemeSection({
  config,
  onChange,
}: {
  config: typeof DEFAULT_CONFIG;
  onChange: (updates: Partial<typeof DEFAULT_CONFIG>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Primary Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={config.primary_color}
            onChange={(e) => onChange({ primary_color: e.target.value })}
            className="w-12 h-9 p-1 cursor-pointer"
          />
          <Input
            value={config.primary_color}
            onChange={(e) => onChange({ primary_color: e.target.value })}
            placeholder="#1e40af"
            className="flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Accent Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={config.accent_color}
            onChange={(e) => onChange({ accent_color: e.target.value })}
            className="w-12 h-9 p-1 cursor-pointer"
          />
          <Input
            value={config.accent_color}
            onChange={(e) => onChange({ accent_color: e.target.value })}
            placeholder="#f59e0b"
            className="flex-1"
          />
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label>Company Logo</Label>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center text-muted-foreground">
            {config.logo_url ? (
              <img
                src={config.logo_url}
                alt="Logo"
                className="h-full w-full object-contain rounded-lg"
              />
            ) : (
              <Upload className="h-6 w-6" />
            )}
          </div>
          <div>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-3 w-3" />
              Upload Logo
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, SVG or JPG. Max 2MB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SEOSection({
  config,
  onChange,
}: {
  config: typeof DEFAULT_CONFIG;
  onChange: (updates: Partial<typeof DEFAULT_CONFIG>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="meta-title">Meta Title</Label>
        <Input
          id="meta-title"
          value={config.meta_title}
          onChange={(e) => onChange({ meta_title: e.target.value })}
          placeholder="Careers - Your Company"
        />
        <p className="text-xs text-muted-foreground">
          {config.meta_title.length}/60 characters
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="meta-desc">Meta Description</Label>
        <Textarea
          id="meta-desc"
          value={config.meta_description}
          onChange={(e) => onChange({ meta_description: e.target.value })}
          placeholder="Describe your careers page for search engines..."
          className="min-h-[80px]"
        />
        <p className="text-xs text-muted-foreground">
          {config.meta_description.length}/160 characters
        </p>
      </div>
      <div className="space-y-2">
        <Label>OG Image</Label>
        <div className="h-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors">
          <div className="text-center">
            <Image className="h-6 w-6 mx-auto mb-1" />
            <span className="text-xs">Upload OG Image (1200x630px)</span>
          </div>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="custom-css">Custom CSS (Advanced)</Label>
        <Textarea
          id="custom-css"
          value={config.custom_css}
          onChange={(e) => onChange({ custom_css: e.target.value })}
          placeholder=".career-hero { /* your styles */ }"
          className="min-h-[120px] font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Add custom CSS to override default styles. Be careful with changes.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live Preview
// ---------------------------------------------------------------------------

function LivePreview({ config }: { config: typeof DEFAULT_CONFIG }) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden text-gray-900">
      {/* Hero */}
      <div
        className="px-8 py-16 text-center text-white"
        style={{ backgroundColor: config.hero_bg_color }}
      >
        {config.logo_url && (
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Briefcase className="h-6 w-6" />
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold mb-2">{config.hero_headline || "Join Our Team"}</h1>
        <p className="text-sm opacity-90 max-w-md mx-auto">
          {config.hero_subheadline || "Build the future with us."}
        </p>
        <button
          className="mt-4 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white border border-white/40 hover:bg-white/10"
          style={{ borderColor: config.accent_color, color: config.accent_color }}
        >
          View Open Positions
        </button>
      </div>

      {/* About */}
      <div className="px-8 py-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: config.primary_color }}>
          About Us
        </h2>
        <p className="text-sm text-gray-600 mb-4">{config.about_text}</p>
        {config.mission && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Our Mission</p>
            <p className="text-sm text-gray-700">{config.mission}</p>
          </div>
        )}
        {config.values.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Our Values</p>
            <div className="flex flex-wrap gap-2">
              {config.values.filter(Boolean).map((v, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: `${config.primary_color}15`,
                    color: config.primary_color,
                  }}
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Benefits */}
      {config.benefits.length > 0 && (
        <div className="px-8 py-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: config.primary_color }}>
            Benefits & Perks
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {config.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 shrink-0" style={{ color: config.accent_color }} />
                {b}
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Culture */}
      <div className="px-8 py-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: config.primary_color }}>
          Team Culture
        </h2>
        <p className="text-sm text-gray-600 mb-4">{config.culture_description}</p>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="aspect-video rounded-md bg-gray-100 flex items-center justify-center"
            >
              <Image className="h-5 w-5 text-gray-300" />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Open Positions */}
      <div className="px-8 py-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: config.primary_color }}>
          Open Positions
        </h2>
        {[
          { title: "Senior Software Engineer", dept: "Engineering", loc: "Remote" },
          { title: "Product Manager", dept: "Product", loc: "New York, NY" },
          { title: "UX Designer", dept: "Design", loc: "San Francisco, CA" },
        ].map((job, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-3 border-b last:border-0"
          >
            <div>
              <p className="text-sm font-medium">{job.title}</p>
              <p className="text-xs text-gray-500">
                {job.dept} &middot; {job.loc}
              </p>
            </div>
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{
                backgroundColor: `${config.accent_color}20`,
                color: config.accent_color,
              }}
            >
              Apply
            </span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Testimonials */}
      {config.testimonials.length > 0 && (
        <div className="px-8 py-8" style={{ backgroundColor: `${config.primary_color}08` }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: config.primary_color }}>
            What Our Team Says
          </h2>
          <div className="space-y-4">
            {config.testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-lg p-4 shadow-sm border">
                <Quote className="h-4 w-4 mb-2" style={{ color: config.accent_color }} />
                <p className="text-sm text-gray-600 italic mb-3">{t.quote || "..."}</p>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                    {(t.name || "?")[0]}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{t.name || "Employee"}</p>
                    <p className="text-[10px] text-gray-500">{t.role || "Team Member"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="px-8 py-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: config.primary_color }}>
          Our Offices
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-3.5 w-3.5" style={{ color: config.primary_color }} />
              <p className="text-xs font-medium">Headquarters</p>
            </div>
            <p className="text-xs text-gray-500">San Francisco, CA</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-3.5 w-3.5" style={{ color: config.primary_color }} />
              <p className="text-xs font-medium">East Coast</p>
            </div>
            <p className="text-xs text-gray-500">New York, NY</p>
          </div>
        </div>
        <div className="mt-3 h-32 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
          Map Placeholder
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-8 py-4 text-center text-xs text-white/70"
        style={{ backgroundColor: config.primary_color }}
      >
        Powered by Talent OS
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CareerPageBuilder() {
  const { data: savedConfig, isLoading } = useCareerPage();
  const updateCareerPage = useUpdateCareerPage();
  const publishCareerPage = usePublishCareerPage();

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [activeSection, setActiveSection] = useState("hero");
  const [hasUnsaved, setHasUnsaved] = useState(false);

  useEffect(() => {
    if (savedConfig) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfig({
        is_published: savedConfig.is_published,
        hero_headline: savedConfig.hero_headline || DEFAULT_CONFIG.hero_headline,
        hero_subheadline: savedConfig.hero_subheadline || DEFAULT_CONFIG.hero_subheadline,
        hero_bg_color: savedConfig.hero_bg_color || DEFAULT_CONFIG.hero_bg_color,
        about_text: savedConfig.about_text || DEFAULT_CONFIG.about_text,
        mission: savedConfig.mission || DEFAULT_CONFIG.mission,
        values: savedConfig.values?.length ? savedConfig.values : DEFAULT_CONFIG.values,
        benefits: savedConfig.benefits?.length ? savedConfig.benefits : DEFAULT_CONFIG.benefits,
        culture_description: savedConfig.culture_description || DEFAULT_CONFIG.culture_description,
        testimonials: savedConfig.testimonials?.length
          ? savedConfig.testimonials
          : DEFAULT_CONFIG.testimonials,
        primary_color: savedConfig.primary_color || DEFAULT_CONFIG.primary_color,
        accent_color: savedConfig.accent_color || DEFAULT_CONFIG.accent_color,
        logo_url: savedConfig.logo_url,
        meta_title: savedConfig.meta_title || DEFAULT_CONFIG.meta_title,
        meta_description: savedConfig.meta_description || DEFAULT_CONFIG.meta_description,
        custom_css: savedConfig.custom_css || "",
      });
    }
  }, [savedConfig]);

  const handleChange = useCallback(
    (updates: Partial<typeof DEFAULT_CONFIG>) => {
      setConfig((prev) => ({ ...prev, ...updates }));
      setHasUnsaved(true);
    },
    []
  );

  async function handleSave() {
    try {
      await updateCareerPage.mutateAsync(config);
      setHasUnsaved(false);
      toast.success("Career page saved successfully");
    } catch {
      toast.error("Failed to save career page");
    }
  }

  async function handleTogglePublish() {
    try {
      const nextState = !config.is_published;
      await publishCareerPage.mutateAsync(nextState);
      setConfig((prev) => ({ ...prev, is_published: nextState }));
      toast.success(nextState ? "Career page published" : "Career page unpublished");
    } catch {
      toast.error("Failed to update publish status");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: "Hiring", href: "/hiring" },
            { label: "Career Page" },
          ]}
        />
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  const SECTIONS = [
    { id: "hero", label: "Hero Section", icon: Globe },
    { id: "about", label: "About Us", icon: Users },
    { id: "benefits", label: "Benefits & Perks", icon: Heart },
    { id: "culture", label: "Team Culture", icon: Users },
    { id: "testimonials", label: "Testimonials", icon: Quote },
    { id: "theme", label: "Color & Branding", icon: Palette },
    { id: "seo", label: "SEO & Advanced", icon: Search },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Career Page" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Career Page Builder
            </h1>
            <Badge variant={config.is_published ? "default" : "secondary"}>
              {config.is_published ? "Published" : "Draft"}
            </Badge>
            {hasUnsaved && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Unsaved changes
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Build and customize your company career page
          </p>
        </div>
        <div className="flex gap-2">
          {config.is_published && (
            <Button variant="outline" asChild>
              <a href="/careers" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Live
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleTogglePublish}
            disabled={publishCareerPage.isPending}
          >
            {publishCareerPage.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : config.is_published ? (
              <EyeOff className="mr-2 h-4 w-4" />
            ) : (
              <Globe className="mr-2 h-4 w-4" />
            )}
            {config.is_published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateCareerPage.isPending || !hasUnsaved}
          >
            {updateCareerPage.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Editor Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Page Sections</CardTitle>
              <CardDescription>
                Click a section to edit its content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${activeSection === section.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                  >
                    <section.icon className="h-4 w-4 flex-shrink-0" />
                    {section.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {SECTIONS.find((s) => s.id === activeSection)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px] pr-4">
                {activeSection === "hero" && (
                  <HeroSection config={config} onChange={handleChange} />
                )}
                {activeSection === "about" && (
                  <AboutSection config={config} onChange={handleChange} />
                )}
                {activeSection === "benefits" && (
                  <BenefitsSection config={config} onChange={handleChange} />
                )}
                {activeSection === "culture" && (
                  <CultureSection config={config} onChange={handleChange} />
                )}
                {activeSection === "testimonials" && (
                  <TestimonialsSection config={config} onChange={handleChange} />
                )}
                {activeSection === "theme" && (
                  <ThemeSection config={config} onChange={handleChange} />
                )}
                {activeSection === "seo" && (
                  <SEOSection config={config} onChange={handleChange} />
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Panel */}
        <div className="sticky top-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Desktop
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[700px]">
                <div className="p-4">
                  <LivePreview config={config} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
