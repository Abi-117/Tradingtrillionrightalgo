
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { adminApi } from "../../lib/adminApi";

export const Route = createFileRoute("/admin/right-algo-dashboard")({
  component: RightAlgoDashboard,
});

type Summary = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  verifiedRevenueRupees: number;
  totalRegistrations: number;
  paidRegistrations: number;
};

type Customer = {
  name?: string;
  email?: string;
  mobile?: string;
};

type Order = {
  _id: string;
  customer?: Customer;
  product?: string;
  payableAmount?: number;
  paymentStatus: string;
  createdAt?: string;
};

const money = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

function RightAlgoDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData(filter = status) {
    setLoading(true);
    setError("");

    try {
      await adminApi("/api/admin/auth/me");

      const [summaryResponse, ordersResponse] = await Promise.all([
        adminApi<any>("/api/admin/right-algo/summary"),
        adminApi<any>(
          `/api/admin/right-algo/orders?page=1&limit=20&status=${encodeURIComponent(filter)}`
        ),
      ]);

      setSummary(summaryResponse.summary);
      setOrders(ordersResponse.orders ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load dashboard";

      setError(message);

      if (/session|login|unauthorized/i.test(message)) {
        await navigate({ to: "/admin/login", replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData("ALL");
    // Load once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    try {
      await adminApi("/api/admin/auth/logout", {
        method: "POST",
        body: JSON.stringify({}),
      });
    } finally {
      await navigate({ to: "/admin/login", replace: true });
    }
  }

  const cards = [
    ["Total Orders", summary?.totalOrders ?? 0],
    ["Paid Orders", summary?.paidOrders ?? 0],
    ["Pending Orders", summary?.pendingOrders ?? 0],
    ["Failed Orders", summary?.failedOrders ?? 0],
    ["Total Registrations", summary?.totalRegistrations ?? 0],
    ["Paid Registrations", summary?.paidRegistrations ?? 0],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <h1 className="text-xl font-bold">Right Algo Trading Admin</h1>
            <p className="mt-1 text-sm text-slate-400">
              Registrations and payment management
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void navigate({ to: "/admin" })}
              className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
            >
              Change Business
            </button>
            <button
              onClick={() => void logout()}
              className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        {error && (
          <p role="alert" className="rounded-lg bg-red-950 p-4 text-red-300">
            {error}
          </p>
        )}

        <section>
          <h2 className="mb-4 text-lg font-semibold">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-3xl font-bold">
                  {loading ? "—" : value}
                </p>
              </div>
            ))}

            <div className="rounded-xl border border-emerald-900 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Verified Revenue</p>
              <p className="mt-3 text-3xl font-bold text-emerald-400">
                {loading
                  ? "—"
                  : money(summary?.verifiedRevenueRupees ?? 0)}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">Right Algo Orders</h2>

            <select
              value={status}
              onChange={(event) => {
                const value = event.target.value;
                setStatus(value);
                void loadData(value);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            >
              <option value="ALL">All Orders</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {loading ? (
            <p className="p-6 text-slate-400">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="p-6 text-slate-400">No Right Algo orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Product</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="p-4">
                        <p>{order.customer?.name || "—"}</p>
                        <p className="text-xs text-slate-400">
                          {order.customer?.email || ""}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.customer?.mobile || ""}
                        </p>
                      </td>
                      <td className="p-4">{order.product || "—"}</td>
                      <td className="p-4">{money(order.payableAmount)}</td>
                      <td className="p-4">{order.paymentStatus}</td>
                      <td className="p-4 text-slate-400">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
<div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => void loadData(status)}
          disabled={loading}
          className="rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
        >
          Refresh Dashboard
        </button>
        <button
  onClick={() => void navigate({ to: "/admin/right-algo-coupons" })}
  className="rounded-lg bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
>
  Manage Software Coupons
</button>


<button
  onClick={() => void navigate({ to: "/admin/right-algo-reports" })}
  className="rounded-lg bg-purple-600 px-4 py-3 font-semibold hover:bg-purple-500"
>
  Manage Daily Reports
</button>
</div>
      </div>
    </main>
  );
}
