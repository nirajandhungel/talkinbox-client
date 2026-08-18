import { useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Zap, User, Mail, Lock, Building2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * OwnerSetupPage — creates the owner account after accepting an invite.
 *
 * Route: /invite/:token/setup
 *
 * On success: auto-login → redirect to dashboard
 */
export default function OwnerSetupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { createOwner } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await createOwner({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        businessName: form.businessName.trim(),
        inviteToken: token,
      });
      setDone(true);
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { label: "Business Info", done: !!form.businessName },
    { label: "Personal Info", done: !!form.name && !!form.email },
    { label: "Security", done: !!form.password && form.password === form.confirmPassword },
  ];

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center space-y-4 max-w-sm w-full">
          <CheckCircle size={48} className="text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Account Created!</h2>
          <p className="text-sm text-slate-500">Redirecting to your dashboard…</p>
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Sync<span className="text-primary-400">Sales</span>
              </span>
            </div>
            <h1 className="text-white font-bold text-xl">Set Up Your Account</h1>
            <p className="text-slate-400 text-sm mt-1">Complete your profile to access the dashboard</p>

            {/* Progress steps */}
            <div className="flex items-center gap-2 mt-4">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full transition-colors ${
                    step.done ? "bg-green-500/20 text-green-400" : "bg-white/10 text-slate-400"
                  }`}>
                    {step.done ? <CheckCircle size={10} /> : <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">{i+1}</span>}
                    {step.label}
                  </div>
                  {i < steps.length - 1 && <div className="w-4 h-px bg-white/20" />}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Business */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Business</p>
              <Input
                label="Business Name"
                placeholder="My Awesome Store"
                value={form.businessName}
                onChange={update("businessName")}
                prefix={<Building2 size={14} />}
                required
              />
            </div>

            {/* Personal */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal</p>
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={form.name}
                onChange={update("name")}
                prefix={<User size={14} />}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={update("email")}
                prefix={<Mail size={14} />}
                autoComplete="email"
                required
              />
            </div>

            {/* Security */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Security</p>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={update("password")}
                prefix={<Lock size={14} />}
                suffix={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="hover:text-slate-600">
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

            <Button
              type="submit"
              className="w-full"
              size="md"
              loading={submitting}
            >
              Create Account & Enter Dashboard
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
