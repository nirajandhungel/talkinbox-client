import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/client";

type Business = {
  id: string; name: string; slug: string; plan: string; status: string;
  aiEnabled: boolean; userCount: number; orderCount: number; productCount: number;
};

export default function BusinessesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => adminApi.get<{ items: Business[] }>("/businesses"),
  });

  if (isLoading) return <p className="text-admin-muted">Loading...</p>;
  if (error) return <p className="text-red-400">{String(error)}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Businesses</h1>
      <div className="admin-card overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Business</th><th>Plan</th><th>Status</th><th>AI</th>
              <th>Users</th><th>Orders</th><th>Products</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((b) => (
              <tr key={b.id}>
                <td>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-admin-muted text-xs">{b.slug}</div>
                </td>
                <td>{b.plan}</td>
                <td>
                  <span className={`badge ${b.status === "active" ? "badge-ok" : "badge-warn"}`}>{b.status}</span>
                </td>
                <td>{b.aiEnabled ? "On" : "Off"}</td>
                <td>{b.userCount}</td>
                <td>{b.orderCount}</td>
                <td>{b.productCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
