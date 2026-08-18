import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, AlertCircle, CheckCircle, ArrowLeft, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import { apiClient } from "@/api/client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await apiClient.post<{ userId?: string; message: string }>("/auth/forgot-password", { email });
      if (res.userId) {
        setUserId(res.userId);
        setStage("reset");
      } else {
        setError("If that email is registered, a reset code was sent.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSubmitting(true);
    setError("");
    try {
      await apiClient.post("/auth/reset-password", { userId, otp, newPassword });
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center space-y-4 max-w-sm w-full">
          <CheckCircle size={48} className="text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Password Reset!</h2>
          <p className="text-sm text-slate-500">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Sync<span className="text-indigo-400">Sales</span></span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3">
              {stage === "email" ? <Mail size={26} className="text-indigo-400" /> : <KeyRound size={26} className="text-indigo-400" />}
            </div>
            <h1 className="text-white font-bold text-xl">{stage === "email" ? "Forgot Password" : "Reset Password"}</h1>
            <p className="text-slate-400 text-sm mt-1">
              {stage === "email" ? "Enter your email to receive a reset code." : `Enter the code sent to ${email}`}
            </p>
          </div>

          <div className="px-8 py-7 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {stage === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <Input label="Email address" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} prefix={<Mail size={14} />} autoComplete="email" required />
                <Button type="submit" className="w-full" size="md" loading={submitting}>Send Reset Code</Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input label="Reset Code (OTP)" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} prefix={<KeyRound size={14} />} required />
                <Input
                  label="New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  prefix={<Lock size={14} />}
                  suffix={<button type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  prefix={<Lock size={14} />}
                  error={confirmPassword && newPassword !== confirmPassword ? "Passwords don't match" : undefined}
                  required
                />
                <Button type="submit" className="w-full" size="md" loading={submitting}>Reset Password</Button>
              </form>
            )}

            <div className="text-center">
              <Link to="/login" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors justify-center">
                <ArrowLeft size={13} />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
