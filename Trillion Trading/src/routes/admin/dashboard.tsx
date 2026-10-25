import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { adminApi } from "../../lib/adminApi";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

type DashboardData = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
  refundedOrders: number;
  verifiedRevenue: number;
};


type CustomerOrder = {
  _id: string;

  customer?: {
    name?: string;
    email?: string;
    mobile?: string;
    phone?: string;
  };

  product?: string | { name?: string; productId?: string };

  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;

  productId?: string;
  payableAmount?: number;
  amount?: number;

  paymentStatus: string;
  createdAt?: string;
};


const money = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

function AdminDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData(filter = status) {
    setLoading(true);
    setError("");

    try {
      await adminApi("/api/admin/auth/me");

      const query =
        filter === "ALL"
          ? ""
          : `&status=${encodeURIComponent(filter)}`;

      const [summaryResponse, ordersResponse] = await Promise.all([
        adminApi<any>("/api/admin/dashboard/summary"),
        adminApi<any>(
          `/api/admin/dashboard/orders?page=1&limit=20${query}`,
        ),
      ]);

      const rawSummary =
        summaryResponse.summary ??
        summaryResponse.data ??
        summaryResponse;

      setSummary({
  totalOrders: rawSummary.totalOrders ?? 0,
  paidOrders: rawSummary.paidOrders ?? 0,
  pendingOrders: rawSummary.pendingOrders ?? 0,
  failedOrders: rawSummary.failedOrders ?? 0,
  refundedOrders: rawSummary.refundedOrders ?? 0,
  verifiedRevenue:
    rawSummary.verifiedRevenueRupees ??
    rawSummary.verifiedRevenue ??
    0,
});

      const rows =
        ordersResponse.orders ??
        ordersResponse.data?.orders ??
        ordersResponse.data;

      setOrders(Array.isArray(rows) ? rows : []);
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
    // Initial dashboard load only.
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
    ["Refunded Orders", summary?.refundedOrders ?? 0],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <div>
            <h1 className="text-xl font-bold">
              Trillion Trading Admin
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Business overview and payment management
            </p>
          </div>

          <button
            onClick={() => void logout()}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Logout
          </button>
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
              <p className="text-sm text-slate-400">
                Verified Revenue
              </p>
              <p className="mt-3 text-3xl font-bold text-emerald-400">
                {loading
                  ? "—"
                  : money(summary?.verifiedRevenue ?? 0)}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 p-5">
            <h2 className="text-lg font-semibold">Customer Orders</h2>

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
            <p className="p-6 text-slate-400">No orders found.</p>
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
  <p>
    {order.customer?.name || order.customerName || "—"}
  </p>

  <p className="text-xs text-slate-400">
    {order.customer?.email || order.customerEmail || ""}
  </p>

  <p className="text-xs text-slate-500">
    {order.customer?.mobile ||
      order.customer?.phone ||
      order.customerPhone ||
      ""}
  </p>
</td>


<td className="p-4">
  {typeof order.product === "string"
    ? order.product
    : order.product?.name ||
      order.product?.productId ||
      order.productId ||
      "—"}
</td>


<td className="p-4">
  {money(order.payableAmount ?? order.amount ?? 0)}
</td>

<td className="p-4">
  {order.paymentStatus}
</td>
<td className="p-4 whitespace-nowrap">
  {order.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
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
          className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-50"
        >
          Refresh Dashboard
        </button>
        

        <button
  onClick={() => void navigate({ to: "/admin/products" })}
  className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold hover:bg-indigo-500"
>
  Manage Products & Coupons
</button>
<button
  onClick={() => void navigate({ to: "/admin/reports" })}
  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold"
>
  Manage Daily Reports
</button>
</div>


      </div>
    </main>
  );
}