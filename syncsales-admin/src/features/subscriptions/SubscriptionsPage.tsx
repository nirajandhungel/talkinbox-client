import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/client";
import { formatNumber } from "@/lib/utils";

type Plan = { plan: string; monthlyPrice: number; tokenLimit: number };
type Sub = {
  id: string; plan: string; status: string; startDate: string;
  monthlyPrice: number; usageLimit: number;
  tenant: { name: string; slug: string };
};

export default function SubscriptionsPage() {
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => adminApi.get<Plan[]>("/subscriptions/plans") });
  const subs = useQuery({ queryKey: ["subscriptions"], queryFn: () => adminApi.get<{ items: Sub[] }>("/subscriptions") });

  if (plans.isLoading || subs.isLoading) return <p className="text-admin-muted">Loading...</p>;
  if (plans.error || subs.error) return <p className="text-red-400">Failed to load</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscriptions</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.data?.map((p) => (
          <div key={p.plan} className="admin-card">
            <p className="text-admin-muted text-sm capitalize">{p.plan}</p>
            <p className="text-2xl font-bold">${p.monthlyPrice}/mo</p>
            <p className="text-admin-muted text-sm mt-1">{formatNumber(p.tokenLimit)} tokens</p>
          </div>
        ))}
      </div>

      <div className="admin-card overflow-x-auto">
        <h2 className="font-semibold mb-4">All Subscriptions</h2>
        <table className="admin-table">
          <thead>
            <tr><th>Business</th><th>Plan</th><th>Status</th><th>Price</th><th>Limit</th><th>Started</th></tr>
          </thead>
          <tbody>
            {subs.data?.items.map((s) => (
              <tr key={s.id}>
                <td>{s.tenant.name}</td>
                <td>{s.plan}</td>
                <td><span className={`badge ${s.status === "active" ? "badge-ok" : "badge-warn"}`}>{s.status}</span></td>
                <td>${s.monthlyPrice}</td>
                <td>{formatNumber(s.usageLimit)}</td>
                <td>{new Date(s.startDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
