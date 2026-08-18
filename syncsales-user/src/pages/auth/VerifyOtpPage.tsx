import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Zap, Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/Button";

interface LocationState {
  userId: string;
  email: string;
  name: string;
}

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [verified, setVerified] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!state?.userId) {
      navigate("/register", { replace: true });
    }
    inputs.current[0]?.focus();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function handleInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError("");
    if (value && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiClient.post("/auth/otp/verify", { userId: state!.userId, otp: code });
      setVerified(true);
      setTimeout(() => navigate("/onboarding", { replace: true }), 1200);
    } catch (err: any) {
      setError(err?.message || "Invalid OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResending(true);
    try {
      await apiClient.post("/auth/otp/resend", { userId: state!.userId });
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center space-y-4 max-w-sm w-full">
          <CheckCircle size={52} className="text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Email Verified!</h2>
          <p className="text-sm text-slate-500">Setting up your business profile…</p>
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Sync<span className="text-indigo-400">Sales</span>
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3">
              <Mail size={26} className="text-indigo-400" />
            </div>
            <h1 className="text-white font-bold text-xl">Check Your Email</h1>
            <p className="text-slate-400 text-sm mt-1.5">
              We sent a 6-digit code to<br />
              <span className="text-indigo-300 font-medium">{state?.email}</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="px-8 py-8 space-y-6">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
                Enter verification code
              </p>
              <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all
                      ${digit ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-800"}
                      focus:border-indigo-500 focus:bg-indigo-50/50`}
                  />
                ))}
              </div>
            </div>

            <Button
              type="button"
              className="w-full"
              size="md"
              loading={submitting}
              onClick={handleVerify}
            >
              Verify Email
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-slate-500">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500 disabled:text-slate-400 disabled:cursor-not-allowed mx-auto transition-colors"
              >
                <RefreshCw size={13} className={resending ? "animate-spin" : ""} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>

            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mx-auto"
            >
              <ArrowLeft size={13} />
              Back to registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
