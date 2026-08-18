import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/client";
import { formatNumber } from "@/lib/utils";

type Summary = {
  totalTokensThisMonth: number;
  estimatedCostUsd: number;
  byModel: Array<{ model: string; tokens: number; requests: number; estimatedCostUsd: number }>;
  topTenants: Array<{ tenantId: string; tenant: { name: string; plan: string } | null; tokens: number }>;
};

export default function AiAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-analytics"],
    queryFn: () => adminApi.get<Summary>("/ai-analytics/summary"),
  });

  if (isLoading) return <p className="text-admin-muted">Loading...</p>;
  if (error) return <p className="text-red-400">{String(error)}</p>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Analytics</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="admin-card">
          <p className="text-admin-muted text-sm">Tokens This Month</p>
          <p className="text-2xl font-bold">{formatNumber(data.totalTokensThisMonth)}</p>
        </div>
        <div className="admin-card">
          <p className="text-admin-muted text-sm">Estimated Cost</p>
          <p className="text-2xl font-bold">${data.estimatedCostUsd}</p>
        </div>
      </div>

      <div className="admin-card overflow-x-auto">
        <h2 className="font-semibold mb-4">By Model</h2>
        <table className="admin-table">
          <thead><tr><th>Model</th><th>Tokens</th><th>Requests</th><th>Est. Cost</th></tr></thead>
          <tbody>
            {data.byModel.map((m) => (
              <tr key={m.model}>
                <td>{m.model}</td>
                <td>{formatNumber(m.tokens)}</td>
                <td>{m.requests}</td>
                <td>${m.estimatedCostUsd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card overflow-x-auto">
        <h2 className="font-semibold mb-4">Top Tenants</h2>
        <table className="admin-table">
          <thead><tr><th>Business</th><th>Plan</th><th>Tokens</th></tr></thead>
          <tbody>
            {data.topTenants.map((t) => (
              <tr key={t.tenantId}>
                <td>{t.tenant?.name ?? t.tenantId}</td>
                <td>{t.tenant?.plan ?? "—"}</td>
                <td>{formatNumber(t.tokens)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
