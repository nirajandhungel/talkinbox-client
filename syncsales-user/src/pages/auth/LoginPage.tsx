import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, WifiOff, Clock } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getErrorMessage, isApiError, apiClient } from "@/api/client";

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

function parseLoginError(err: unknown): { message: string; type: "offline" | "pending" | "error" } {
  const raw = getErrorMessage(err);
  if (isApiError(err) && err.status === 0) return { message: "No internet connection.", type: "offline" };
  if (raw.includes("ACCOUNT_PENDING")) return { message: "Your account is under review.", type: "pending" };
  if (raw.toLowerCase().includes("invalid credentials") || raw.toLowerCase().includes("unauthorized")) return { message: "Incorrect email or password.", type: "error" };
  return { message: raw || "Something went wrong. Please try again.", type: "error" };
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{ message: string; type: "offline" | "pending" | "error" } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError({ message: "Please enter your email address.", type: "error" }); return; }
    if (!password) { setError({ message: "Please enter your password.", type: "error" }); return; }
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(parseLoginError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) { setError({ message: "Google sign-in is not configured.", type: "error" }); return; }
    setGoogleLoading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        if ((window as any).google) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Google"));
        document.head.appendChild(s);
      });
      const idToken = await new Promise<string>((resolve, reject) => {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (r: { credential: string }) => resolve(r.credential),
          error_callback: (e: any) => reject(e),
        });
        (window as any).google.accounts.id.prompt((n: any) => {
          if (n.isNotDisplayed() || n.isSkippedMoment()) reject(new Error("Dismissed"));
        });
      });
      const res = await apiClient.post<{
        tokens: { accessToken: string; refreshToken: string };
        requiresOnboarding: boolean;
      }>("/auth/google", { idToken });
      const { tokenStore } = await import("@/api/client");
      tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);
      navigate(res.requiresOnboarding ? "/onboarding" : from, { replace: true });
    } catch (err: any) {
      setError({ message: err?.message || "Google sign-in failed.", type: "error" });
    } finally {
      setGoogleLoading(false);
    }
  }

  const errorColors = {
    offline: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: <WifiOff size={15} className="text-amber-500 shrink-0 mt-0.5" /> },
    pending: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: <Clock size={15} className="text-blue-500 shrink-0 mt-0.5" /> },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" /> },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-5">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Sync<span className="text-indigo-400">Sales</span></span>
            </div>
            <p className="text-slate-400 text-sm">Sign in to your business dashboard</p>
          </div>

          <div className="px-8 pt-6 pb-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-60"
            >
              {googleLoading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">or sign in with email</span></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-5">
            {error && (
              <div className={`flex items-start gap-3 rounded-lg px-4 py-3 border ${errorColors[error.type].bg} ${errorColors[error.type].border}`}>
                {errorColors[error.type].icon}
                <p className={`text-xs ${errorColors[error.type].text}`}>{error.message}</p>
              </div>
            )}
            <Input label="Email address" type="email" placeholder="you@company.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} prefix={<Mail size={14} />} autoComplete="email" required />
            <Input
              label="Password" type={showPassword ? "text" : "password"} placeholder="••••••••"
              value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
              prefix={<Lock size={14} />}
              suffix={
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              autoComplete="current-password" required
            />
            <div className="flex justify-end -mt-2">
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-500 transition-colors">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full" size="md" loading={submitting} disabled={submitting}>Sign In</Button>
          </form>

          <div className="px-8 pb-6 text-center border-t pt-4">
            <div className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">Register your business</Link>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-slate-500">
          By signing in you agree to our <a href="#" className="text-slate-400 hover:text-white">Terms of Service</a> & <a href="#" className="text-slate-400 hover:text-white">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
