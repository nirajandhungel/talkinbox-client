import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Zap, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import type { InviteToken } from "@/auth/auth.types";
import { Button } from "@/components/ui/Button";

/**
 * InviteAcceptPage — validates the invite token from the URL.
 *
 * Route: /invite/:token
 *
 * Valid:   → shows info and a CTA to go to owner setup
 * Invalid: → shows error state
 */
export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { validateInvite } = useAuth();

  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [invite, setInvite] = useState<InviteToken | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMsg("No invite token provided.");
      return;
    }
    validateInvite(token)
      .then((inv) => {
        setInvite(inv);
        setStatus("valid");
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setStatus("invalid");
      });
  }, [token, validateInvite]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-7 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Sync<span className="text-primary-400">Sales</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm">You've been invited to join</p>
          </div>

          {/* Body */}
          <div className="px-8 py-10 text-center space-y-6">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-primary-600 animate-spin" />
                <p className="text-sm text-slate-500">Validating your invite…</p>
              </div>
            )}

            {status === "valid" && invite && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle size={28} className="text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-800">Your invite is valid!</h2>
                  <p className="text-sm text-slate-500">
                    Set up your SyncSales business account to get started.
                  </p>
                </div>
                <Button
                  className="w-full"
                  size="md"
                  onClick={() => navigate(`/invite/${token}/setup`)}
                >
                  Create Your Account →
                </Button>
              </>
            )}

            {status === "invalid" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto">
                  <AlertCircle size={28} className="text-red-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-800">Invalid Invite</h2>
                  <p className="text-sm text-slate-500">{errorMsg}</p>
                </div>
                <Button variant="secondary" className="w-full" onClick={() => navigate("/login")}>
                  Back to Login
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
