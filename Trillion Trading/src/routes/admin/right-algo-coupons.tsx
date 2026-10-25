
import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { adminApi } from "../../lib/adminApi";

export const Route = createFileRoute("/admin/right-algo-coupons")({
  component: RightAlgoCoupons,
});

type Coupon = {
  _id: string;
  code: string;
  products: string[];
  discountAmount: number;
  maxUses: number;
  usedCount: number;
  startsAt: string;
  expiresAt: string | null;
  active: boolean;
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function RightAlgoCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState("500");
  const [maxUses, setMaxUses] = useState("0");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCoupons() {
    try {
      const response = await adminApi<any>(
        "/api/admin/right-algo/coupons"
      );
      setCoupons(response.coupons ?? []);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Unable to load coupons";
      setError(text);

      if (/session|login|unauthorized/i.test(text)) {
        await navigate({ to: "/admin/login", replace: true });
      }
    }
  }

  useEffect(() => {
    void loadCoupons();
    // Load once when this page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const discount = Number(discountAmount);
      const uses = Number(maxUses);

      if (!Number.isInteger(discount) || discount < 1 || discount >= 9999) {
        throw new Error("Discount must be a whole rupee amount below ₹9,999.");
      }

      if (!Number.isInteger(uses) || uses < 0) {
        throw new Error("Usage limit must be 0 or a positive whole number.");
      }

      await adminApi("/api/admin/right-algo/coupons", {
        method: "POST",
        body: JSON.stringify({
          code,
          products: ["RIGHT_SOFTWARE"],
          discountAmount: discount,
          maxUses: uses,
          expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null,
          active: true,
        }),
      });

      setMessage("Right Algo software coupon created successfully.");
      setCode("");
      setDiscountAmount("500");
      setMaxUses("0");
      setExpiresAt("");
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create coupon.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    setError("");
    setMessage("");

    try {
      await adminApi(`/api/admin/right-algo/coupons/${coupon._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !coupon.active }),
      });

      setMessage(`Coupon ${coupon.active ? "deactivated" : "activated"}.`);
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update coupon.");
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-purple-500";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <h1 className="text-xl font-bold">Right Algo Software Coupons</h1>
            <p className="mt-1 text-sm text-slate-400">
              Coupons apply to software purchases only, not registration.
            </p>
          </div>

          <button
            onClick={() => void navigate({ to: "/admin/right-algo-dashboard" })}
            className="rounded-lg border border-slate-700 px-4 py-2 hover:bg-slate-800"
          >
            Back to Right Algo Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        {error && (
          <p role="alert" className="rounded-lg bg-red-950 p-4 text-red-300">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-lg bg-emerald-950 p-4 text-emerald-300">
            {message}
          </p>
        )}

        <form
          onSubmit={createCoupon}
          className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <h2 className="text-lg font-semibold">Create Software Coupon</h2>

          <p className="text-sm text-slate-400">
            Software price reference: ₹9,999. Registration fee is excluded.
          </p>

          <label className="block text-sm text-slate-300">
            Coupon Code
            <input
              className={inputClass}
              required
              minLength={3}
              maxLength={40}
              pattern="[A-Za-z0-9_-]+"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Example: RIGHT500"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Fixed Discount (₹)
            <input
              className={inputClass}
              type="number"
              min={1}
              max={9998}
              step={1}
              required
              value={discountAmount}
              onChange={(event) => setDiscountAmount(event.target.value)}
            />
          </label>

          <label className="block text-sm text-slate-300">
            Maximum Uses (0 = unlimited)
            <input
              className={inputClass}
              type="number"
              min={0}
              step={1}
              required
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
            />
          </label>

          <label className="block text-sm text-slate-300">
            Expiry Date (optional)
            <input
              className={inputClass}
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Coupon"}
          </button>
        </form>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Existing Coupons</h2>

          {coupons.length === 0 ? (
            <p className="text-slate-400">No Right Algo coupons yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-4">Code</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Usage</th>
                    <th className="p-4">Expiry</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950">
                  {coupons.map((coupon) => (
                    <tr key={coupon._id}>
                      <td className="p-4 font-semibold">{coupon.code}</td>
                      <td className="p-4">{money(coupon.discountAmount)}</td>
                      <td className="p-4">
                        {coupon.usedCount} / {coupon.maxUses || "Unlimited"}
                      </td>
                      <td className="p-4">
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString("en-IN")
                          : "No expiry"}
                      </td>
                      <td className="p-4">
                        {coupon.active ? "Active" : "Inactive"}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => void toggleCoupon(coupon)}
                          className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800"
                        >
                          {coupon.active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
