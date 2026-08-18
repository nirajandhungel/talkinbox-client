import { useQuery } from "@tanstack/react-query";
import { Search, Download, TrendingUp, TrendingDown, BookOpen } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { accountingApi } from "@/api";
import { QUERY_KEYS } from "@/constants";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { useSearch, usePagination } from "@/hooks";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonTable, SkeletonCard } from "@/components/feedback/Skeleton";

export default function AccountingPage() {
  const { search, setSearch, debouncedSearch } = useSearch();
  const { page, pageSize, setPage, setPageSize } = usePagination();

  // Get date range — last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const from = sixMonthsAgo.toISOString().split("T")[0];
  const to = now.toISOString().split("T")[0];

  const { data: txData, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.transactions, { page, pageSize, search: debouncedSearch }],
    queryFn: () => accountingApi.getTransactions({ page, pageSize, search: debouncedSearch }),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: [...QUERY_KEYS.analytics, "accounting-summary", from, to],
    queryFn: () => accountingApi.getSummary(from, to),
  });

  const transactions = txData?.data ?? [];
  const monthlyData = summary?.monthlyData ?? [];
  const expenseData = summary?.expenseBreakdown ?? [];
  const cashFlowData = summary?.cashFlow ?? [];
  const latestMonth = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null;

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Accounting</h2>
          <p className="text-xs text-slate-500">Financial ledger & analytics</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download size={13} />}>Export</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
        ) : (
          [
            { label: "Total Revenue", value: summary ? formatCompact(summary.totalRevenue) : "—", positive: true },
            { label: "Total Expenses", value: summary ? formatCompact(summary.totalExpenses) : "—", positive: false },
            { label: "Net Profit", value: summary ? formatCompact(summary.netProfit) : "—", positive: (summary?.netProfit ?? 0) >= 0 },
            { label: "Profit Margin", value: latestMonth && latestMonth.revenue > 0 ? `${Math.round((latestMonth.profit / latestMonth.revenue) * 100)}%` : "—", positive: true },
          ].map(s => (
            <Card key={s.label}>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-500">{s.label}</p>
                {s.positive
                  ? <TrendingUp size={12} className="text-green-500" />
                  : <TrendingDown size={12} className="text-red-500" />
                }
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Cash Flow" subtitle="Weekly inflow vs outflow" />
          {cashFlowData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={cashFlowData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="inflowG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outflowG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="inflow" stroke="#10B981" strokeWidth={2} fill="url(#inflowG)" name="Inflow" />
                <Area type="monotone" dataKey="outflow" stroke="#EF4444" strokeWidth={2} fill="url(#outflowG)" name="Outflow" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">No cash flow data available</div>
          )}
        </Card>

        <Card>
          <CardHeader title="Expense Breakdown" />
          {expenseData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={expenseData} dataKey="amount" cx="50%" cy="50%" outerRadius={55} paddingAngle={2}>
                    {expenseData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {expenseData.map(e => (
                  <div key={e.category} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: e.color }} />
                    <span className="text-[10px] text-slate-600 flex-1 truncate">{e.category}</span>
                    <span className="text-[10px] font-medium text-slate-700">{formatCompact(e.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">No expense data available</div>
          )}
        </Card>
      </div>

      {/* Transaction Ledger */}
      <Card padding="none">
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <BookOpen size={14} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-800 flex-1">Transaction Ledger</h3>
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            prefix={<Search size={12} />}
            containerClassName="w-48"
          />
        </div>

        {isLoading ? (
          <SkeletonTable rows={6} />
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["ID", "Date", "Type", "Category", "Description", "Amount", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No transactions found</td></tr>
                ) : (
                  transactions.map((tx, i) => (
                    <tr key={tx.id} className={`${i < transactions.length - 1 ? "border-b border-slate-50" : ""} hover:bg-slate-50 transition-colors`}>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{String(tx.id).slice(0, 8)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{tx.date}</td>
                      <td className="px-4 py-3">
                        <Badge
                          color={tx.type === "revenue" ? "#10B981" : "#EF4444"}
                          bg={tx.type === "revenue" ? "#f0fdf4" : "#fef2f2"}
                        >
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{tx.category}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-[200px] truncate">{tx.description}</td>
                      <td className={`px-4 py-3 text-xs font-semibold ${tx.type === "revenue" ? "text-green-700" : "text-red-600"}`}>
                        {tx.type === "expense" ? "-" : "+"}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          color={tx.status === "reconciled" ? "#10B981" : "#F59E0B"}
                          bg={tx.status === "reconciled" ? "#f0fdf4" : "#fffbeb"}
                        >
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-slate-100">
              <Pagination
                page={page}
                totalPages={txData?.totalPages ?? 1}
                total={txData?.total ?? 0}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={size => { setPageSize(size); setPage(1); }}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
