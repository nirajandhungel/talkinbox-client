import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Zap, User, Mail, Lock, Building2, Phone,
  Eye, EyeOff, AlertCircle, CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/api/client";

// Google Icon SVG
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M47.5 24.5c0-1.6-.15-3.2-.43-4.7H24v8.9h13.2c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.3 7.3-10.6 7.3-17.4z" fill="#4285F4"/>
      <path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.9-6c-2.1 1.4-4.8 2.3-8 2.3-6.1 0-11.3-4.1-13.1-9.7H2.8v6.2C6.8 42.5 14.8 48 24 48z" fill="#34A853"/>
      <path d="M10.9 28.8A14.7 14.7 0 0 1 10.4 24c0-1.7.3-3.3.7-4.8V13H2.8A23.9 23.9 0 0 0 0 24c0 3.9.9 7.6 2.8 10.8l8.1-6z" fill="#FBBC05"/>
      <path d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.7-6.7C35.9 2.1 30.5 0 24 0 14.8 0 6.8 5.5 2.8 13.2l8.1 6.2C12.7 13.6 17.9 9.5 24 9.5z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    business_name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const res = await apiClient.post<{
        tokens: { accessToken: string; refreshToken: string };
        user: { id: string; name: string; email: string };
        requiresEmailVerification: boolean;
      }>("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        business_name: form.business_name.trim(),
      });

      // Store tokens
      const { tokenStore } = await import("@/api/client");
      tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);
      localStorage.setItem("ss_session", JSON.stringify({
        user: res.user,
        accessToken: res.tokens.accessToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }));

      // Go to OTP verification
      navigate("/verify-email", {
        state: { userId: res.user.id, email: form.email.trim(), name: form.name.trim() },
        replace: true,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to register. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google sign-in is not configured.");
      return;
    }
    setGoogleLoading(true);
    try {
      // Load Google GSI
      await new Promise<void>((resolve, reject) => {
        if ((window as any).google) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Sign-In"));
        document.head.appendChild(script);
      });

      const idToken = await new Promise<string>((resolve, reject) => {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential: string }) => resolve(response.credential),
          error_callback: (err: any) => reject(err),
        });
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            reject(new Error("Google sign-in was dismissed"));
          }
        });
      });

      const res = await apiClient.post<{
        tokens: { accessToken: string; refreshToken: string };
        user: { id: string; name: string; email: string };
        isNewUser: boolean;
        requiresOnboarding: boolean;
      }>("/auth/google", { idToken });

      const { tokenStore } = await import("@/api/client");
      tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);

      if (res.requiresOnboarding) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  const steps = [
    { label: "Business", done: !!form.business_name },
    { label: "Personal", done: !!form.name && !!form.email },
    { label: "Security", done: !!form.password && form.password === form.confirmPassword },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br bg-background flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg space-y-5">
        <div className="bg-surface rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r bg-surface-elevated px-8 py-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Zap size={16} className="text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-primary-foreground">
                Sync<span className="text-primary">Sales</span>
              </span>
            </div>
            <h1 className="text-foreground font-bold text-xl">Create Your Account</h1>
            <p className="text-foreground-muted text-sm mt-1">Start managing your business with AI</p>

            <div className="flex items-center gap-2 mt-4">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full transition-colors ${
                    step.done ? "bg-success/20 text-success" : "bg-surface/10 text-foreground-muted"
                  }`}>
                    {step.done ? <CheckCircle size={10} /> : <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
                    {step.label}
                  </div>
                  {i < steps.length - 1 && <div className="w-4 h-px bg-surface/20" />}
                </div>
              ))}
            </div>
          </div>

          {/* Google Sign-in */}
          <div className="px-8 pt-6 pb-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 border-2 border-border rounded-xl px-4 py-3 text-sm font-semibold text-foreground hover:bg-surface-elevated hover:border-border transition-all disabled:opacity-60"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-foreground-muted border-t-transparent rounded-full animate-spin" />
              ) : <GoogleIcon />}
              Continue with Google
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-3 text-xs text-foreground-muted">or register with email</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-7 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-error/10 border border-error/20 rounded-lg px-3.5 py-3">
                <AlertCircle size={15} className="text-error shrink-0 mt-0.5" />
                <p className="text-xs text-error">{error}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-3">Business</p>
              <Input label="Business Name" placeholder="My Awesome Store" value={form.business_name} onChange={update("business_name")} prefix={<Building2 size={14} />} />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Personal</p>
              <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={update("name")} prefix={<User size={14} />} required />
              <Input label="Email Address" type="email" placeholder="you@company.com" value={form.email} onChange={update("email")} prefix={<Mail size={14} />} autoComplete="email" required />
              <Input label="Phone Number" type="tel" placeholder="98XXXXXXXX" value={form.phone} onChange={update("phone")} prefix={<Phone size={14} />} required />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Security</p>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={update("password")}
                prefix={<Lock size={14} />}
                suffix={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="hover:text-foreground-muted">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                autoComplete="new-password"
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                prefix={<Lock size={14} />}
                error={form.confirmPassword && form.password !== form.confirmPassword ? "Passwords don't match" : undefined}
                autoComplete="new-password"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="md" loading={submitting}>
              Create Account
            </Button>
          </form>

          <div className="px-8 pb-6 flex flex-col gap-3 text-center bg-surface-elevated/50 pt-4 border-t">
            <div className="text-sm text-foreground-muted">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
