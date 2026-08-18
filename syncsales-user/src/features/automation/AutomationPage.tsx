import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { automationApi } from "@/api";
import {
  Zap, Plus, ToggleLeft, ToggleRight, Bot, MessageSquare,
  Package, Truck, ShoppingBag, AlertTriangle,
  Save, Sparkles, Edit3
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/feedback/Toast";
import { SkeletonCard } from "@/components/feedback/Skeleton";
import { cn } from "@/lib/utils";

const getIconForTrigger = (name: string, trigger: string) => {
  const text = (name + " " + trigger).toLowerCase();
  if (text.includes("message") || text.includes("reply")) return MessageSquare;
  if (text.includes("stock") || text.includes("inventory")) return AlertTriangle;
  if (text.includes("order") || text.includes("cart")) return ShoppingBag;
  if (text.includes("delivery") || text.includes("truck")) return Truck;
  if (text.includes("welcome")) return Sparkles;
  if (text.includes("restock")) return Package;
  return Zap;
};

interface AIPersonality {
  name: string;
  tone: string;
  greeting: string;
  language: string;
  responseSpeed: "instant" | "natural" | "slow";
  features: { id: string; label: string; enabled: boolean }[];
}

const DEFAULT_PERSONALITY: AIPersonality = {
  name: "SyncBot",
  tone: "friendly",
  greeting: "Hello! 👋 Welcome to our store. How can I help you today?",
  language: "English + Nepali mix",
  responseSpeed: "instant",
  features: [
    { id: "auto_reply", label: "Auto-reply to messages", enabled: true },
    { id: "order_create", label: "Create orders from chat", enabled: true },
    { id: "product_recommend", label: "Product recommendations", enabled: true },
    { id: "price_query", label: "Answer price queries", enabled: true },
    { id: "stock_check", label: "Check stock availability", enabled: true },
    { id: "handoff", label: "Human handoff on complex queries", enabled: true },
    { id: "upsell", label: "Auto-suggest upsells", enabled: false },
    { id: "collect_feedback", label: "Post-delivery feedback collection", enabled: false },
  ],
};

const TONE_OPTIONS = [
  { value: "friendly", label: "Friendly & Casual", emoji: "😊" },
  { value: "professional", label: "Professional", emoji: "👔" },
  { value: "enthusiastic", label: "Enthusiastic", emoji: "🎉" },
  { value: "minimal", label: "Minimal & Direct", emoji: "📋" },
];

const TABS = [
  { id: "rules", label: "Automation Rules", icon: Zap },
  { id: "ai", label: "AI Personality", icon: Bot },
] as const;

// ─── Main Component ───────────────────────────────────────────────

export default function AutomationPage() {
  const queryClient = useQueryClient();
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: () => automationApi.getRules(),
  });

  const automations = rulesData || [];
  
  const [personality, setPersonality] = useState(DEFAULT_PERSONALITY);
  const [activeTab, setActiveTab] = useState<"rules" | "ai">("rules");
  const [editingGreeting, setEditingGreeting] = useState(false);
  const { success, info } = useToast();

  const toggleMutation = useMutation({
    mutationFn: (args: { id: string; active: boolean }) =>
      automationApi.updateRule(args.id, { active: args.active }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["automations"] });
      const a = automations.find(x => x.id === variables.id);
      success(`${a?.name || 'Rule'} ${variables.active ? "activated" : "paused"}`);
    },
  });

  const toggleAutomation = (id: string, currentActive: boolean) => {
    toggleMutation.mutate({ id, active: !currentActive });
  };

  const toggleFeature = (featureId: string) => {
    setPersonality((prev) => ({
      ...prev,
      features: prev.features.map((f) =>
        f.id === featureId ? { ...f, enabled: !f.enabled } : f
      ),
    }));
  };

  const activeCount = automations.filter((a) => a.active).length;
  const totalRuns = automations.reduce((s, a) => s + (a.triggered || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5 max-w-[1000px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Automation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeCount} active rules · {totalRuns.toLocaleString()} total executions
          </p>
        </div>
        <Button size="sm" icon={<Plus size={13} />} onClick={() => info("New automation — coming soon")}>
          New Automation
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                isActive ? "text-primary-600" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <TabIcon size={13} />
              {tab.label}
              {isActive && (
                <motion.div layoutId="autoTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Rules Tab ────────────────────────────────── */}
      {activeTab === "rules" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={`sk_${i}`} />)}
          {!isLoading && automations.length === 0 && (
            <Card padding="md">
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-slate-800">No automation rules found</p>
                <p className="text-xs text-slate-500 mt-1">Create your first rule to automate tasks.</p>
              </div>
            </Card>
          )}
          {!isLoading && automations.map((automation) => {
            const AutoIcon = getIconForTrigger(automation.name, automation.trigger);
            return (
              <Card key={automation.id} padding="md">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${automation.active ? "bg-primary-50" : "bg-slate-50"}`}>
                    <AutoIcon size={16} className={automation.active ? "text-primary-600" : "text-slate-400"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{automation.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        WHEN: {automation.trigger}
                      </span>
                      <span className="text-slate-300">→</span>
                      <span className="text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded font-medium">
                        THEN: {automation.action}
                      </span>
                    </div>
                  </div>
                  <div className="text-right mr-4 hidden sm:block">
                    <p className="text-sm font-bold text-slate-700">{(automation.triggered || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">total runs</p>
                  </div>
                  <Badge
                    color={automation.active ? "#10B981" : "#6B7280"}
                    bg={automation.active ? "#f0fdf4" : "#f9fafb"}
                  >
                    {automation.active ? "Active" : "Paused"}
                  </Badge>
                  <button
                    onClick={() => toggleAutomation(automation.id, automation.active)}
                    className="text-slate-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                    disabled={toggleMutation.isPending}
                  >
                    {automation.active ? (
                      <ToggleRight size={24} className="text-primary-600" />
                    ) : (
                      <ToggleLeft size={24} />
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </motion.div>
      )}

      {/* ─── AI Personality Tab ────────────────────────── */}
      {activeTab === "ai" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Bot Info */}
          <Card>
            <CardHeader title="Bot Identity" subtitle="Customize your AI assistant's personality" />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Bot Name"
                value={personality.name}
                onChange={(e) => setPersonality((p) => ({ ...p, name: e.target.value }))}
              />
              <Input
                label="Language"
                value={personality.language}
                onChange={(e) => setPersonality((p) => ({ ...p, language: e.target.value }))}
              />
            </div>

            {/* Tone Selection */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">Conversation Tone</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TONE_OPTIONS.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setPersonality((p) => ({ ...p, tone: tone.value }))}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all",
                      personality.tone === tone.value
                        ? "border-primary-300 bg-primary-50 text-primary-700 ring-1 ring-primary-200"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span className="text-base">{tone.emoji}</span>
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">Response Speed</p>
              <div className="flex gap-2">
                {[
                  { value: "instant", label: "⚡ Instant", desc: "< 1 second" },
                  { value: "natural", label: "💬 Natural", desc: "1-3 seconds" },
                  { value: "slow", label: "🧠 Thoughtful", desc: "3-5 seconds" },
                ].map((speed) => (
                  <button
                    key={speed.value}
                    onClick={() => setPersonality((p) => ({ ...p, responseSpeed: speed.value as AIPersonality["responseSpeed"] }))}
                    className={cn(
                      "flex-1 px-3 py-2.5 rounded-lg border text-center transition-all",
                      personality.responseSpeed === speed.value
                        ? "border-primary-300 bg-primary-50 ring-1 ring-primary-200"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <p className="text-xs font-medium text-slate-700">{speed.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{speed.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Greeting Message */}
          <Card>
            <CardHeader
              title="Greeting Message"
              subtitle="First message sent to new conversations"
              action={
                <Button
                  variant="ghost"
                  size="xs"
                  icon={editingGreeting ? <Save size={12} /> : <Edit3 size={12} />}
                  onClick={() => {
                    if (editingGreeting) success("Greeting saved!");
                    setEditingGreeting(!editingGreeting);
                  }}
                >
                  {editingGreeting ? "Save" : "Edit"}
                </Button>
              }
            />
            {editingGreeting ? (
              <textarea
                value={personality.greeting}
                onChange={(e) => setPersonality((p) => ({ ...p, greeting: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                rows={3}
              />
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                <p className="text-sm text-slate-700">{personality.greeting}</p>
              </div>
            )}

            {/* Preview */}
            <div className="mt-4 bg-slate-900 rounded-xl p-4">
              <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider">Chat Preview</p>
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-slate-800 rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                  <p className="text-xs text-slate-200">{personality.greeting}</p>
                  <p className="text-[9px] text-slate-500 mt-1">{personality.name} · just now</p>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Features */}
          <Card>
            <CardHeader title="AI Capabilities" subtitle="Toggle bot features on/off" />
            <div className="space-y-2">
              {personality.features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${feature.enabled ? "bg-green-500" : "bg-slate-300"}`} />
                    <span className="text-sm text-slate-700">{feature.label}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={feature.enabled}
                      onChange={() => toggleFeature(feature.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600" />
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              size="sm"
              icon={<Save size={13} />}
              onClick={() => success("AI personality settings saved!")}
            >
              Save All Settings
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
