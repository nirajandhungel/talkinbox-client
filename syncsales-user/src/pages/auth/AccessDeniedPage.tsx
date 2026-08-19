import { ShieldOff, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center">
        <ShieldOff size={28} className="text-error" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-foreground-muted max-w-sm">
          You don't have permission to view this page. Contact your account owner to request access.
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        icon={<ArrowLeft size={14} />}
        onClick={() => navigate("/")}
      >
        Go to Dashboard
      </Button>
    </div>
  );
}
