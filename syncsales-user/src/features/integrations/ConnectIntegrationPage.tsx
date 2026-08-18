import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/Card";

export default function ConnectIntegrationPage() {
  const nav = useNavigate();
  const params = useParams();
  const platform = (params.platform as string | undefined) ?? "facebook";

  useEffect(() => {
    nav(`/integrations?platform=${platform}&step=auth`, { replace: true });
  }, [nav, platform]);

  return (
    <Card>
      <p className="text-xs text-slate-500">Redirecting to the integrations flow…</p>
    </Card>
  );
}
