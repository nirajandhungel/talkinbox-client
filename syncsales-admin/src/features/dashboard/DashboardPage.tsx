import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/client";
import { formatNumber } from "@/lib/utils";

type Overview = {
  totalBusinesses: number;
  activeUsers: number;
  activeSubscriptions: number;
  revenueEstimate: { mrr: number; currency: string };
  tokenUsage: { totalTokensThisMonth: number; byModel: Array<{ model: string; tokens: number }> };
  systemHealth: { api: { status: string; latencyMs: number }; ai: { status: string; latencyMs: number } };
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-card">
      <p className="text-admin-muted text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "ok" ? "badge-ok" : status === "down" ? "badge-down" : "badge-warn";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => adminApi.get<Overview>("/dashboard/overview"),
  });

  if (isLoading) return <p className="text-admin-muted">Loading...</p>;
  if (error) return <p className="text-red-400">{String(error)}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Businesses" value={data.totalBusinesses} />
        <StatCard label="Active Users" value={data.activeUsers} />
        <StatCard label="Subscriptions" value={data.activeSubscriptions} />
        <StatCard label="MRR" value={`$${data.revenueEstimate.mrr}`} />
        <StatCard label="AI Tokens" value={formatNumber(data.tokenUsage.totalTokensThisMonth)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="admin-card">
          <h2 className="text-sm text-admin-muted mb-3">API Server</h2>
          <StatusBadge status={data.systemHealth.api.status} />
          <p className="text-admin-muted text-sm mt-2">{data.systemHealth.api.latencyMs}ms</p>
        </div>
        <div className="admin-card">
          <h2 className="text-sm text-admin-muted mb-3">AI Server</h2>
          <StatusBadge status={data.systemHealth.ai.status} />
          <p className="text-admin-muted text-sm mt-2">{data.systemHealth.ai.latencyMs}ms</p>
        </div>
      </div>

      {data.tokenUsage.byModel.length > 0 && (
        <div className="admin-card overflow-x-auto">
          <h2 className="font-semibold mb-4">Token Usage by Model</h2>
          <table className="admin-table">
            <thead><tr><th>Model</th><th>Tokens</th></tr></thead>
            <tbody>
              {data.tokenUsage.byModel.map((m) => (
                <tr key={m.model}><td>{m.model}</td><td>{formatNumber(m.tokens)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
