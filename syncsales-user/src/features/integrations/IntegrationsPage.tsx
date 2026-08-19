import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Zap,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/feedback/Toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient, { getErrorMessage } from "@/api/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "facebook" | "instagram" | "whatsapp";
type FlowStep = "dashboard" | "auth" | "select" | "done";

type IntegrationAccount = {
  id: string;
  platform: string;
  externalAccountId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  status: string; // connected | disconnected | reconnect_required | error | connecting
  connectedAt?: string;
  lastSyncAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

type AvailableAccount = {
  id: string;
  name: string;
  platform: Platform;
  category?: string;
  avatarUrl?: string | null;
  metadata?: {
    username?: string | null;
    pageId?: string | null;
    phoneNumbers?: Array<{
      id: string;
      displayPhoneNumber?: string | null;
      verifiedName?: string | null;
    }>;
  };
};

type PlatformStatus = {
  label: string;
  tone: "green" | "amber" | "rose" | "slate";
  count: number;
  errorMessage: string | null;
};

// ─── Brand Icons (inline SVG) ─────────────────────────────────────────────────

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12c0-5.524-4.477-10-10-10S2 6.476 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

// ─── Platform Config ──────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<
  Platform,
  {
    name: string;
    description: string;
    color: string;
    bg: string;
    borderColor: string;
    gradient: string;
    helpText: string;
    Icon: React.FC<{ size?: number }>;
  }
> = {
  facebook: {
    name: "Facebook",
    description:
      "Connect your Facebook Page to receive Messenger messages and manage customer orders in one place.",
    color: "#1877F2",
    bg: "rgba(24,119,242,0.07)",
    borderColor: "rgba(24,119,242,0.2)",
    gradient: "linear-gradient(135deg,#1877F2,#0d5cbf)",
    helpText:
      "We'll request access to your Facebook Pages. All permissions are read/write for messaging only.",
    Icon: FacebookIcon,
  },
  instagram: {
    name: "Instagram",
    description:
      "Sync Instagram Direct Messages and story replies directly into your SyncSales unified inbox.",
    color: "#C13584",
    bg: "rgba(193,53,132,0.07)",
    borderColor: "rgba(193,53,132,0.2)",
    gradient: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    helpText:
      "Your Instagram Business account must be linked to a Facebook Page to appear here.",
    Icon: InstagramIcon,
  },
  whatsapp: {
    name: "WhatsApp",
    description:
      "Connect WhatsApp Business API to send and receive customer messages at scale with automation.",
    color: "#25D366",
    bg: "rgba(37,211,102,0.07)",
    borderColor: "rgba(37,211,102,0.2)",
    gradient: "linear-gradient(135deg,#25D366,#128C7E)",
    helpText:
      "You need a WhatsApp Business Account linked to your Meta Business portfolio.",
    Icon: WhatsAppIcon,
  },
};

const PLATFORMS: Platform[] = ["facebook", "instagram", "whatsapp"];

const FLOW_STEPS: { id: FlowStep; label: string }[] = [
  { id: "dashboard", label: "Platforms" },
  { id: "auth", label: "Authorize" },
  { id: "select", label: "Select" },
  { id: "done", label: "Done" },
];

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({
  active,
  activePlatform,
}: {
  active: FlowStep;
  activePlatform: Platform | null;
}) {
  const idx = FLOW_STEPS.findIndex((s) => s.id === active);
  const cfg = activePlatform ? PLATFORM_CONFIG[activePlatform] : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 0,
        padding: "16px 20px",
      }}
    >
      {FLOW_STEPS.map((s, i) => {
        const isDone = i < idx;
        const isActive = i === idx;
        const circleColor = isDone
          ? "#16a34a"
          : isActive
          ? cfg?.color ?? "#2563eb"
          : "#94a3b8";
        const circleBg = isDone
          ? "#f0fdf4"
          : isActive
          ? cfg?.bg ?? "#eff6ff"
          : "#f8fafc";
        const circleBorder = isDone
          ? "#86efac"
          : isActive
          ? cfg?.borderColor ?? "#bfdbfe"
          : "#e2e8f0";

        return (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < FLOW_STEPS.length - 1 ? "1 1 auto" : "0 0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  background: circleBg,
                  color: circleColor,
                  border: `2px solid ${circleBorder}`,
                  transition: "all 0.25s ease",
                  flexShrink: 0,
                }}
              >
                {isDone ? <CheckCircle size={15} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#1e293b" : isDone ? "#64748b" : "#94a3b8",
                  letterSpacing: "0.02em",
                }}
              >
                {s.label}
              </span>
            </div>

            {i < FLOW_STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  minWidth: 20,
                  background: isDone ? "#86efac" : "#e2e8f0",
                  margin: "0 6px",
                  marginBottom: 18,
                  transition: "background 0.4s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Status Chip ──────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: PlatformStatus }) {
  const map: Record<string, { bg: string; color: string; dot: string }> = {
    green: { bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
    amber: { bg: "#fffbeb", color: "#92400e", dot: "#f59e0b" },
    rose: { bg: "#fff1f2", color: "#9f1239", dot: "#f43f5e" },
    slate: { bg: "#f8fafc", color: "#475569", dot: "#cbd5e1" },
  };
  const s = map[status.tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.dot}44`,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {status.label}
    </span>
  );
}

// ─── Platform Icon Box ────────────────────────────────────────────────────────

function PlatformIconBox({
  platform,
  size = 44,
}: {
  platform: Platform;
  size?: number;
}) {
  const cfg = PLATFORM_CONFIG[platform];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: cfg.bg,
        border: `1.5px solid ${cfg.borderColor}`,
        color: cfg.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <cfg.Icon size={size * 0.48} />
    </div>
  );
}

// ─── Account Initials Avatar ──────────────────────────────────────────────────

function AccountAvatar({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#667eea,#764ba2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, warning } = useToast();
  const qc = useQueryClient();

  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const [step, setStep] = useState<FlowStep>("dashboard");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [disconnecting, setDisconnecting] = useState<Platform | null>(null);
  const popupRef = useRef<Window | null>(null);

  // ─── Query: current integration accounts ──────────────────────────────────

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["integrations", "accounts"],
    queryFn: () =>
      apiClient.get<IntegrationAccount[]>("/integrations/accounts"),
    staleTime: 10_000,
    // Auto-poll while any account is still in "connecting" state
    refetchInterval: (query) => {
      const data = query.state.data as IntegrationAccount[] | undefined;
      const anyConnecting = (data ?? []).some(
        (a) => a.status === "connecting"
      );
      return anyConnecting ? 3_000 : false;
    },
  });

  // Base Meta OAuth account (platform='meta', no externalAccountId)
  const metaBaseAccount = useMemo(
    () =>
      accounts.find(
        (a) => a.platform === "meta" && !a.externalAccountId
      ),
    [accounts]
  );

  // ─── Query: available Meta accounts to select ──────────────────────────────

  const {
    data: availableAccounts = [],
    isLoading: isLoadingAvailable,
    error: availableError,
    refetch: refetchAvailable,
  } = useQuery({
    queryKey: ["integrations", "meta", "available", activePlatform],
    queryFn: () =>
      apiClient.get<AvailableAccount[]>(
        `/integrations/meta/accounts?platform=${activePlatform}`
      ),
    enabled: step === "select" && !!activePlatform,
    staleTime: 0,
    retry: 1,
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const startOAuth = useMutation({
    mutationFn: ({ platform, authType, prompt }: { platform: Platform; authType?: string; prompt?: string }) =>
      apiClient.post<{ url: string }>("/integrations/connect", { platform, authType, prompt }),
    onSuccess: (data) => {
      // Re-target the synchronously opened window by its name
      const popup = window.open(
        data.url,
        "meta_oauth",
        "width=560,height=700,left=200,top=80"
      );
      
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        warning(
          "Popup was blocked. Please allow popups for this site and click 'Open Meta Login' again."
        );
      } else {
        success("Meta login opened — approve access, then return here.");
      }
    },
    onError: (e) => {
      if (popupRef.current) {
        popupRef.current.close();
        popupRef.current = null;
      }
      const msg = getErrorMessage(e);
      if (msg.toLowerCase().includes("not configured")) {
        warning(
          "Meta integration is not configured on this server. Please contact support."
        );
      } else {
        warning(msg);
      }
    },
  });

  const handleOpenOAuth = (platform: Platform, authType?: string, prompt?: string) => {
    // Open synchronously on click to bypass popup blockers (e.g. Brave)
    popupRef.current = window.open(
      "about:blank",
      "meta_oauth",
      "width=560,height=700,left=200,top=80"
    );
    startOAuth.mutate({ platform, authType, prompt });
  };

  const disconnectOne = useMutation({
    mutationFn: (id: string) => apiClient.del(`/integrations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
    onError: (e) => warning(getErrorMessage(e)),
  });

  const saveAccounts = useMutation({
    mutationFn: () =>
      apiClient.post("/integrations/meta/accounts/select", {
        platform: activePlatform,
        accountIds: selectedIds,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      success(
        `${
          activePlatform ? PLATFORM_CONFIG[activePlatform].name : "Account"
        } connected successfully!`
      );
      setStep("done");
      if (activePlatform) {
        setSearchParams(
          { platform: activePlatform, step: "done" },
          { replace: true }
        );
      }
    },
    onError: (e) => {
      const msg = getErrorMessage(e);
      if (msg.toLowerCase().includes("instagram")) {
        warning(
          "Account not linked to Facebook Page. Link your Instagram Business account to a Facebook Page first."
        );
      } else if (msg.toLowerCase().includes("permission")) {
        warning(
          "Permission not granted. Please approve all requested permissions during Meta login."
        );
      } else {
        warning(msg);
      }
    },
  });

  // ─── OAuth popup message listener ──────────────────────────────────────────

  useEffect(() => {
    const handle = (e: MessageEvent) => {
      if (e.data === "oauth_success") {
        qc.invalidateQueries({ queryKey: ["integrations"] });
        success("Authorization successful! Now select your accounts below.");
        setStep("select");
        if (activePlatform) {
          setSearchParams(
            { platform: activePlatform, step: "select" },
            { replace: true }
          );
        }
      }
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, [activePlatform, qc, setSearchParams, success]);

  // ─── Sync URL search params → state ────────────────────────────────────────

  useEffect(() => {
    const p = searchParams.get("platform") as Platform | null;
    const s = searchParams.get("step") as FlowStep | null;
    if (p && p !== activePlatform) setActivePlatform(p);
    if (s && s !== step) setStep(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If on auth step and meta token is already connected, skip to select
  useEffect(() => {
    if (
      step === "auth" &&
      metaBaseAccount?.status === "connected"
    ) {
      setStep("select");
      if (activePlatform) {
        setSearchParams(
          { platform: activePlatform, step: "select" },
          { replace: true }
        );
      }
    }
  }, [activePlatform, metaBaseAccount?.status, setSearchParams, step]);

  // Reset selected accounts when platform changes
  useEffect(() => {
    setSelectedIds([]);
  }, [activePlatform]);

  // ─── Derived state: per-platform status ────────────────────────────────────

  const platformStatus = useMemo(() => {
    return PLATFORMS.reduce<Record<Platform, PlatformStatus>>((acc, p) => {
      // Sub-accounts for this specific platform (have an externalAccountId)
      const sub = accounts.filter(
        (a) => a.platform === p && a.externalAccountId
      );
      const connected = sub.filter((a) => a.status === "connected");
      const hasError = sub.some((a) => a.status === "error");
      const needsReconnect = sub.some(
        (a) => a.status === "reconnect_required"
      );
      // If meta base token expired, all platforms implicitly need reconnect
      const metaExpired =
        metaBaseAccount?.status === "reconnect_required" && sub.length > 0;
      const errorMsg =
        sub.find((a) => a.errorMessage)?.errorMessage ??
        (metaExpired ? "Connection expired. Please reconnect." : null);

      let label = "Disconnected";
      let tone: PlatformStatus["tone"] = "slate";

      if (connected.length > 0) {
        label =
          connected.length > 1
            ? `Connected (${connected.length})`
            : "Connected";
        tone = "green";
      } else if (hasError) {
        label = "Error";
        tone = "rose";
      } else if (needsReconnect || metaExpired) {
        label = "Reconnect";
        tone = "amber";
      }

      acc[p] = { label, tone, count: connected.length, errorMessage: errorMsg };
      return acc;
    }, {} as Record<Platform, PlatformStatus>);
  }, [accounts, metaBaseAccount?.status]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const beginConnect = (platform: Platform) => {
    setActivePlatform(platform);
    const metaReady = metaBaseAccount?.status === "connected";
    const nextStep: FlowStep = metaReady ? "select" : "auth";
    setStep(nextStep);
    setSearchParams({ platform, step: nextStep }, { replace: true });
    if (!metaReady) {
      handleOpenOAuth(platform);
    }
  };

  const disconnectPlatform = async (platform: Platform) => {
    const platformAccounts = accounts.filter(
      (a) => a.platform === platform && a.externalAccountId
    );
    if (!platformAccounts.length) return;
    setDisconnecting(platform);
    for (const acct of platformAccounts) {
      await disconnectOne.mutateAsync(acct.id);
    }
    success(`${PLATFORM_CONFIG[platform].name} disconnected.`);
    setDisconnecting(null);
  };

  const backToDashboard = () => {
    setStep("dashboard");
    setActivePlatform(null);
    setSelectedIds([]);
    setSearchParams({}, { replace: true });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="space-y-5 max-w-[960px]"
    >
      {/* Page header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">Integrations</h2>
        <p className="text-xs text-foreground-muted mt-0.5">
          Connect your Meta platforms to sync messages, orders, and customers.
        </p>
      </div>

      {/* Stepper */}
      <Card padding="sm">
        <Stepper active={step} activePlatform={activePlatform} />
      </Card>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Dashboard ─────────────────────────────────────────── */}
        {step === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-surface rounded-xl border border-border p-5 h-40 skeleton"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLATFORMS.map((p) => {
                  const cfg = PLATFORM_CONFIG[p];
                  const status = platformStatus[p];
                  const isConnected = status.tone === "green";
                  const isReconnect = status.tone === "amber";
                  const isLoggingOut =
                    disconnecting === p || disconnectOne.isPending;

                  return (
                    <motion.div
                      key={p}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Card
                        padding="md"
                        className="flex flex-col gap-4 h-full"
                        style={{
                          borderColor: isConnected
                            ? cfg.borderColor
                            : undefined,
                        }}
                      >
                        {/* Card top */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <PlatformIconBox platform={p} size={46} />
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {cfg.name}
                              </p>
                              <StatusChip status={status} />
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-foreground-muted leading-relaxed flex-1">
                          {cfg.description}
                        </p>

                        {/* Error/reconnect banner */}
                        {(isReconnect || status.tone === "rose") &&
                          status.errorMessage && (
                            <div
                              style={{
                                background:
                                  status.tone === "rose"
                                    ? "#fff1f2"
                                    : "#fffbeb",
                                border: `1px solid ${
                                  status.tone === "rose"
                                    ? "#fecdd3"
                                    : "#fde68a"
                                }`,
                                borderRadius: 8,
                                padding: "6px 10px",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 6,
                              }}
                            >
                              <AlertCircle
                                size={13}
                                style={{
                                  color:
                                    status.tone === "rose"
                                      ? "#f43f5e"
                                      : "#f59e0b",
                                  flexShrink: 0,
                                  marginTop: 1,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 11,
                                  color:
                                    status.tone === "rose"
                                      ? "#9f1239"
                                      : "#92400e",
                                }}
                              >
                                {status.errorMessage}
                              </span>
                            </div>
                          )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          {isConnected ? (
                            <>
                              <Button
                                variant="ghost"
                                onClick={() => beginConnect(p)}
                                style={{ fontSize: 12 }}
                              >
                                <RefreshCw size={13} className="mr-1" />
                                Add More
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => disconnectPlatform(p)}
                                loading={isLoggingOut && disconnecting === p}
                                style={{ fontSize: 12, marginLeft: "auto" }}
                              >
                                Disconnect
                              </Button>
                            </>
                          ) : (
                            <Button
                              id={`connect-${p}`}
                              onClick={() => beginConnect(p)}
                              loading={
                                startOAuth.isPending && activePlatform === p
                              }
                              style={{
                                background: cfg.gradient,
                                border: "none",
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              <Zap size={13} className="mr-1" />
                              {isReconnect ? "Reconnect" : "Connect"}
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* How it works */}
            <div className="mt-4 p-4 bg-surface-elevated rounded-xl border border-border flex flex-wrap gap-6">
              {[
                {
                  num: "01",
                  title: "Click Connect",
                  body: "Opens the secure Meta login in a popup window.",
                },
                {
                  num: "02",
                  title: "Approve Access",
                  body: "Grant SyncSales permission to read and send messages.",
                },
                {
                  num: "03",
                  title: "Select Accounts",
                  body: "Choose which pages or numbers to link.",
                },
                {
                  num: "04",
                  title: "Messages Flow In",
                  body: "Your inbox is live. Respond from SyncSales.",
                },
              ].map((h) => (
                <div key={h.num} className="flex items-start gap-2 min-w-0">
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#cbd5e1",
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    {h.num}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {h.title}
                    </p>
                    <p className="text-[11px] text-foreground-muted">{h.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Authorization ──────────────────────────────────────── */}
        {step === "auth" && activePlatform && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Card padding="md">
              {/* Back button */}
              <button
                onClick={backToDashboard}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "#64748b",
                  marginBottom: 20,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <ArrowLeft size={14} />
                Back to Platforms
              </button>

              <div className="flex flex-col items-center text-center gap-5 py-4 max-w-sm mx-auto">
                {/* Platform icon */}
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 18,
                    background: PLATFORM_CONFIG[activePlatform].bg,
                    border: `2px solid ${PLATFORM_CONFIG[activePlatform].borderColor}`,
                    color: PLATFORM_CONFIG[activePlatform].color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {(() => {
                    const Ic = PLATFORM_CONFIG[activePlatform].Icon;
                    return <Ic size={36} />;
                  })()}
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Connect{" "}
                    {PLATFORM_CONFIG[activePlatform].name} to SyncSales
                  </h3>
                  <p className="text-xs text-foreground-muted mt-1.5 leading-relaxed">
                    {PLATFORM_CONFIG[activePlatform].helpText}
                  </p>
                </div>

                {/* Steps */}
                <div className="w-full text-left space-y-2">
                  {[
                    "A secure Meta login popup will open",
                    "Log in and approve the requested permissions",
                    "The popup closes automatically when done",
                    "You'll then select which account to link",
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background:
                            PLATFORM_CONFIG[activePlatform].bg,
                          border: `1px solid ${PLATFORM_CONFIG[activePlatform].borderColor}`,
                          color: PLATFORM_CONFIG[activePlatform].color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs text-foreground-muted">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Status badge */}
                {metaBaseAccount?.status === "connecting" ? (
                  <div className="flex items-center gap-2 text-xs text-primary bg-primary-soft border border-primary/20 rounded-lg px-3 py-2">
                    <Loader2 size={13} className="animate-spin" />
                    Completing authorization…
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#f59e0b",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    Waiting for authorization…
                  </div>
                )}

                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={backToDashboard}
                    className="flex-1"
                    style={{ fontSize: 13 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    id="open-meta-login"
                    onClick={() => handleOpenOAuth(activePlatform)}
                    loading={startOAuth.isPending}
                    className="flex-1"
                    style={{
                      background:
                        PLATFORM_CONFIG[activePlatform].gradient,
                      border: "none",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Open Meta Login
                  </Button>
                </div>

                <p className="text-[11px] text-foreground-muted">
                  If the popup didn't open, allow popups in your browser and
                  try again.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 3: Account Selection ──────────────────────────────────── */}
        {step === "select" && activePlatform && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Card padding="md">
              {/* Back */}
              <button
                onClick={backToDashboard}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "#64748b",
                  marginBottom: 18,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <ArrowLeft size={14} />
                Back to Platforms
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <PlatformIconBox platform={activePlatform} size={40} />
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Select {PLATFORM_CONFIG[activePlatform].name} Account
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Choose the accounts you want to connect to SyncSales.
                  </p>
                </div>
              </div>

              {/* Account list */}
              <div className="space-y-2 min-h-[80px]">
                {isLoadingAvailable ? (
                  <div className="flex items-center gap-2 p-4 bg-surface-elevated rounded-xl border border-border text-xs text-foreground-muted">
                    <Loader2 size={14} className="animate-spin" />
                    Fetching your {PLATFORM_CONFIG[activePlatform].name}{" "}
                    accounts…
                  </div>
                ) : availableError ? (
                  <div className="p-4 bg-error/10 border border-error/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        size={14}
                        className="text-rose-500 mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="text-xs font-semibold text-rose-800">
                          Could not load accounts
                        </p>
                        <p className="text-[11px] text-rose-600 mt-0.5">
                          {getErrorMessage(availableError)}
                        </p>
                        <button
                          onClick={() => refetchAvailable()}
                          className="text-[11px] text-rose-700 underline mt-1"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  </div>
                ) : availableAccounts.length === 0 ? (
                  <div className="p-4 bg-surface-elevated border border-border rounded-xl">
                    <p className="text-xs font-semibold text-foreground">
                      No Facebook Pages found
                    </p>
                    <div className="text-[11px] text-foreground-muted mt-1 space-y-1">
                      <p>Make sure:</p>
                      <ol className="list-decimal pl-4 space-y-0.5">
                        <li>Your account is full Admin on at least one Page.</li>
                        <li>Instagram Business account is linked to the Page.</li>
                        <li>You selected the Page during Meta consent popup.</li>
                      </ol>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        style={{ fontSize: 11 }}
                        onClick={() => handleOpenOAuth(activePlatform, "rerequest", "select_account")}
                        loading={startOAuth.isPending}
                      >
                        <RefreshCw size={12} className="mr-1.5" />
                        Reconnect / Retry Meta Login
                      </Button>
                    </div>
                  </div>
                ) : (
                  availableAccounts.map((acct) => {
                    const selected = selectedIds.includes(acct.id);
                    return (
                      <label
                        key={acct.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: `1.5px solid ${
                            selected
                              ? PLATFORM_CONFIG[activePlatform].borderColor
                              : "#e2e8f0"
                          }`,
                          background: selected
                            ? PLATFORM_CONFIG[activePlatform].bg
                            : "#fff",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          style={{
                            width: 15,
                            height: 15,
                            accentColor:
                              PLATFORM_CONFIG[activePlatform].color,
                            flexShrink: 0,
                          }}
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, acct.id]);
                            } else {
                              setSelectedIds((prev) =>
                                prev.filter((id) => id !== acct.id)
                              );
                            }
                          }}
                        />
                        <AccountAvatar name={acct.name} size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {acct.name}
                          </p>
                          {acct.category && (
                            <p className="text-[10px] text-foreground-muted">
                              {acct.category}
                            </p>
                          )}
                          {acct.metadata?.username && (
                            <p className="text-[10px] text-foreground-muted">
                              @{acct.metadata.username}
                            </p>
                          )}
                          {acct.metadata?.phoneNumbers?.length ? (
                            <p className="text-[10px] text-foreground-muted mt-0.5">
                              {acct.metadata.phoneNumbers
                                .map(
                                  (ph) =>
                                    ph.displayPhoneNumber ||
                                    ph.verifiedName ||
                                    ph.id
                                )
                                .join(", ")}
                            </p>
                          ) : null}
                        </div>
                        {/* Platform tag */}
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: 20,
                            background:
                              PLATFORM_CONFIG[acct.platform]?.bg ??
                              "#f1f5f9",
                            color:
                              PLATFORM_CONFIG[acct.platform]?.color ??
                              "#64748b",
                            flexShrink: 0,
                          }}
                        >
                          {acct.platform}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Footer actions */}
              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={backToDashboard}
                  style={{ fontSize: 13 }}
                >
                  Cancel
                </Button>
                <div className="flex-1" />
                {selectedIds.length > 0 && (
                  <span className="text-xs text-foreground-muted">
                    {selectedIds.length} selected
                  </span>
                )}
                <Button
                  id="connect-selected"
                  onClick={() => saveAccounts.mutate()}
                  loading={saveAccounts.isPending}
                  disabled={selectedIds.length === 0}
                  style={{
                    background:
                      selectedIds.length > 0
                        ? PLATFORM_CONFIG[activePlatform].gradient
                        : undefined,
                    border: selectedIds.length > 0 ? "none" : undefined,
                    color: selectedIds.length > 0 ? "#fff" : undefined,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle size={14} className="mr-1" />
                  Connect{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── STEP 4: Done ──────────────────────────────────────────────── */}
        {step === "done" && activePlatform && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <Card padding="md">
              <div className="flex flex-col items-center text-center gap-5 py-6 max-w-sm mx-auto">
                {/* Success icon */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "#f0fdf4",
                    border: "2px solid #bbf7d0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#16a34a",
                  }}
                >
                  <CheckCircle size={36} strokeWidth={2} />
                </motion.div>

                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {PLATFORM_CONFIG[activePlatform].name} Connected!
                  </h3>
                  <p className="text-xs text-foreground-muted mt-1.5 leading-relaxed">
                    Your integration is active. New messages will start
                    appearing in your SyncSales inbox within minutes.
                  </p>
                </div>

                {/* Connected accounts summary */}
                {(() => {
                  const connected = accounts.filter(
                    (a) =>
                      a.platform === activePlatform &&
                      a.externalAccountId &&
                      a.status === "connected"
                  );
                  return connected.length > 0 ? (
                    <div className="w-full space-y-1.5">
                      {connected.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 12px",
                            background: PLATFORM_CONFIG[activePlatform].bg,
                            border: `1px solid ${PLATFORM_CONFIG[activePlatform].borderColor}`,
                            borderRadius: 10,
                          }}
                        >
                          <AccountAvatar name={a.displayName ?? "Account"} size={28} />
                          <span className="text-xs font-semibold text-foreground truncate flex-1 text-left">
                            {a.displayName ?? "Account"}
                          </span>
                          <CheckCircle size={13} className="text-success shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}

                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={backToDashboard}
                    className="flex-1"
                    style={{ fontSize: 13 }}
                  >
                    Back to Integrations
                  </Button>
                  <Button
                    id="go-to-inbox"
                    onClick={() => nav("/inbox")}
                    className="flex-1"
                    style={{
                      background:
                        PLATFORM_CONFIG[activePlatform].gradient,
                      border: "none",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <Inbox size={14} className="mr-1" />
                    Go to Inbox
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
