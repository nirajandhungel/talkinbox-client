import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, MapPin, Phone, Globe, Instagram, Facebook,
  Star, Tag, MessageSquare, ChevronRight, ChevronLeft,
  CheckCircle, Sparkles, ArrowRight,
} from "lucide-react";
import { apiClient } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthShell, AuthCard, BrandMark } from "@/pages/auth/AuthLayout";
import { useAuth } from "@/auth/useAuth";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Retail", "Restaurant / Food", "E-commerce", "Fashion / Clothing", "Electronics", "Beauty / Cosmetics", "Health / Pharmacy", "Services", "Education", "Real Estate", "Other"];
const TONES = [
  { value: "professional", label: "Professional", desc: "Formal and business-like" },
  { value: "friendly", label: "Friendly", desc: "Warm and approachable" },
  { value: "casual", label: "Casual", desc: "Relaxed and conversational" },
  { value: "formal", label: "Formal", desc: "Official and authoritative" },
];

const STEPS = ["Business Identity", "Location & Contact", "Social Media", "AI Training"];

interface ProfileForm {
  businessName: string; tagline: string; bio: string; category: string; subCategory: string;
  country: string; city: string; address: string; phone: string; website: string; supportEmail: string;
  instagramHandle: string; facebookPage: string; tiktokHandle: string; whatsappNumber: string;
  targetAudience: string; uniqueValueProp: string; primaryProducts: string;
  averageOrderValue: string; monthlyOrders: string; toneOfVoice: string; aiContext: string;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    businessName: session?.tenant?.businessName || "",
    tagline: "", bio: "", category: "", subCategory: "",
    country: "Nepal", city: "", address: "", phone: "", website: "", supportEmail: "",
    instagramHandle: "", facebookPage: "", tiktokHandle: "", whatsappNumber: "",
    targetAudience: "", uniqueValueProp: "", primaryProducts: "",
    averageOrderValue: "", monthlyOrders: "", toneOfVoice: "professional", aiContext: "",
  });

  const update = (field: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  function canProceed() {
    if (step === 0) return form.businessName.trim() && form.bio.trim().length >= 20;
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) { setStep((s) => s + 1); return; }

    if (!form.bio.trim()) { setError("Please write a bio for your business."); return; }
    setSubmitting(true);
    setError("");
    try {
      await apiClient.patch("/auth/business-profile", form);
      setDone(true);
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err: any) {
      setError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AuthShell maxWidth="sm">
        <AuthCard>
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={36} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">You're all set!</h2>
            <p className="text-sm text-foreground-muted">Your business profile is ready. Taking you to your dashboard…</p>
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell maxWidth="xl">
      <div className="flex items-center justify-between mb-6">
        <BrandMark />
        <button onClick={() => navigate("/", { replace: true })} className="text-xs text-foreground-muted hover:text-foreground transition-colors">
          Skip for now →
        </button>
      </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                  i < step && "bg-success text-primary-foreground",
                  i === step && "bg-primary text-primary-foreground",
                  i > step && "bg-surface-elevated text-foreground-muted",
                )}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={cn("text-xs font-medium hidden sm:block", i === step ? "text-foreground" : "text-foreground-muted")}>{s}</span>
                {i < STEPS.length - 1 && <div className={cn("h-px flex-1 mx-2", i < step ? "bg-success" : "bg-border")} />}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}>
          <AuthCard>
            <div className="bg-primary px-8 py-6">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-primary-foreground/80" />
                <div>
                  <h1 className="text-primary-foreground font-bold text-xl">{STEPS[step]}</h1>
                  <p className="text-primary-foreground/80 text-sm">
                    {step === 0 && "Tell us about your business — this helps AI understand you better."}
                    {step === 1 && "Where are you located and how can customers reach you?"}
                    {step === 2 && "Connect your social media platforms."}
                    {step === 3 && "Train your AI agent to represent your brand perfectly."}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-8 py-7 space-y-5">
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-lg px-4 py-3 text-sm text-error">{error}</div>
              )}

              {/* STEP 0: Business Identity */}
              {step === 0 && (
                <div className="space-y-4">
                  <Input label="Business Name *" placeholder="My Awesome Store" value={form.businessName} onChange={update("businessName")} prefix={<Building2 size={14} />} required />
                  <Input label="Tagline" placeholder="e.g. Nepal's trusted electronics store" value={form.tagline} onChange={update("tagline")} prefix={<Star size={14} />} />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Business Bio * <span className="text-foreground-muted font-normal">(Describe what your business does — this is key for AI)</span>
                    </label>
                    <textarea
                      className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={4}
                      placeholder="We are a Kathmandu-based clothing store specializing in Nepali traditional and modern fashion. We sell online via Instagram and our website, delivering across Nepal. Our customers are young professionals aged 20-35 who value quality and cultural style..."
                      value={form.bio}
                      onChange={update("bio")}
                      required
                    />
                    <p className={`text-xs mt-1 ${form.bio.length < 20 ? "text-foreground-muted" : "text-success"}`}>
                      {form.bio.length}/2000 characters {form.bio.length < 20 && "(minimum 20)"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                      <select value={form.category} onChange={update("category")} className="w-full border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <Input label="Sub-category" placeholder="e.g. Clothing" value={form.subCategory} onChange={update("subCategory")} prefix={<Tag size={14} />} />
                  </div>
                </div>
              )}

              {/* STEP 1: Location & Contact */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Country" value={form.country} onChange={update("country")} prefix={<MapPin size={14} />} />
                    <Input label="City" placeholder="Kathmandu" value={form.city} onChange={update("city")} prefix={<MapPin size={14} />} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
                    <textarea className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={2} placeholder="Street, area, city" value={form.address} onChange={update("address")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Phone" placeholder="+977-9841234567" value={form.phone} onChange={update("phone")} prefix={<Phone size={14} />} />
                    <Input label="Website" placeholder="https://mystore.com" value={form.website} onChange={update("website")} prefix={<Globe size={14} />} />
                  </div>
                  <Input label="Support Email" type="email" placeholder="support@mybusiness.com" value={form.supportEmail} onChange={update("supportEmail")} prefix={<MessageSquare size={14} />} />
                </div>
              )}

              {/* STEP 2: Social Media */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-foreground-muted">Connect your social channels so the AI knows where your customers come from.</p>
                  <Input label="Instagram Handle" placeholder="@mystore" value={form.instagramHandle} onChange={update("instagramHandle")} prefix={<Instagram size={14} />} />
                  <Input label="Facebook Page" placeholder="https://facebook.com/mystore" value={form.facebookPage} onChange={update("facebookPage")} prefix={<Facebook size={14} />} />
                  <Input label="TikTok Handle" placeholder="@mystore" value={form.tiktokHandle} onChange={update("tiktokHandle")} prefix={<span className="text-xs font-bold">TT</span>} />
                  <Input label="WhatsApp Number" placeholder="+977-9841234567" value={form.whatsappNumber} onChange={update("whatsappNumber")} prefix={<Phone size={14} />} />
                </div>
              )}

              {/* STEP 3: AI Training */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="bg-primary-soft rounded-xl px-4 py-3 border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-1">🤖 Why does this matter?</p>
                    <p className="text-xs text-primary">The more context you provide, the better your AI agent can handle customer inquiries, create orders, and represent your brand automatically.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Target Audience</label>
                    <textarea className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={3} placeholder="Young professionals aged 20-35, primarily in Kathmandu Valley, active on Instagram, interested in fashion and lifestyle…" value={form.targetAudience} onChange={update("targetAudience")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">What Makes You Unique?</label>
                    <textarea className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={3} placeholder="We offer same-day delivery in Kathmandu, authentic handmade products, and 7-day return policy…" value={form.uniqueValueProp} onChange={update("uniqueValueProp")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Primary Products / Services</label>
                    <textarea className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={2} placeholder="Women's kurta sets, Men's daura suruwal, Accessories, Custom embroidery…" value={form.primaryProducts} onChange={update("primaryProducts")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Avg Order Value (NPR)" placeholder="e.g. 1500-3000" value={form.averageOrderValue} onChange={update("averageOrderValue")} prefix={<span className="text-xs">₹</span>} />
                    <Input label="Monthly Orders (approx)" placeholder="e.g. 50-100" value={form.monthlyOrders} onChange={update("monthlyOrders")} prefix={<Tag size={14} />} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">AI Tone of Voice</label>
                    <div className="grid grid-cols-2 gap-3">
                      {TONES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, toneOfVoice: t.value }))}
                          className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${form.toneOfVoice === t.value ? "border-primary bg-primary-soft" : "border-border hover:border-border"}`}
                        >
                          <p className={`text-sm font-semibold ${form.toneOfVoice === t.value ? "text-primary" : "text-foreground"}`}>{t.label}</p>
                          <p className="text-xs text-foreground-muted">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Extra AI Instructions <span className="text-foreground-muted font-normal">(optional)</span></label>
                    <textarea className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={3} placeholder="Always greet customers in Nepali first. Never offer discounts above 20%. Always confirm delivery address before creating orders…" value={form.aiContext} onChange={update("aiContext")} />
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="px-8 pb-7 flex items-center justify-between border-t border-border pt-5">
              <button
                type="button"
                onClick={() => step > 0 && setStep((s) => s - 1)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${step > 0 ? "text-foreground-muted hover:text-foreground" : "text-foreground-muted cursor-not-allowed"}`}
                disabled={step === 0}
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <div className="flex items-center gap-2">
                {STEPS.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-primary w-4" : i < step ? "bg-success" : "bg-surface-elevated"}`} />
                ))}
              </div>

              <Button
                type="submit"
                size="sm"
                loading={submitting}
                disabled={!canProceed()}
                className="flex items-center gap-2"
              >
                {step < STEPS.length - 1 ? (
                  <><span>Continue</span><ChevronRight size={15} /></>
                ) : (
                  <><span>Finish Setup</span><ArrowRight size={15} /></>
                )}
              </Button>
            </div>
          </AuthCard>
        </form>
    </AuthShell>
  );
}
