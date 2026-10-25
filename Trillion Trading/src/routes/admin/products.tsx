
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { adminApi } from "../../lib/adminApi";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Course = {
  _id: string;
  productId: "LEVEL_1" | "LEVEL_2" | "COURSE_PACKAGE";
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  totalSessions: number;
  topics: string[];
  active: boolean;
};

type Software = {
  _id: string;
  productId: "SOFTWARE";
  name: string;
  description?: string;
  price: number;
  trialDays: number;
  features: string[];
  active: boolean;
};

type Coupon = {
  _id: string;
  code: string;
  products: string[];
  discountAmount: number;
  maxUses: number;
  usedCount: number;
  startsAt?: string;
  expiresAt?: string | null;
  active: boolean;
};

const productOptions = [
  { id: "LEVEL_1", label: "Level 1 Course" },
  { id: "LEVEL_2", label: "Level 2 Course" },
  { id: "COURSE_PACKAGE", label: "Full Course Package" },
  { id: "SOFTWARE", label: "BUY & SELL Software" },
];

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

function AdminProducts() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [software, setSoftware] = useState<Software | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("2000");
  const [couponProducts, setCouponProducts] = useState<string[]>([
    "LEVEL_1",
  ]);
  const [couponMaxUses, setCouponMaxUses] = useState("0");
  const [couponExpiry, setCouponExpiry] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [productResponse, couponResponse] = await Promise.all([
        adminApi<any>("/api/admin/products"),
        adminApi<any>("/api/admin/coupons"),
      ]);

      const productData =
        productResponse.data ?? productResponse;

      setCourses(
        Array.isArray(productData.courses)
          ? productData.courses
          : [],
      );

      setSoftware(
        Array.isArray(productData.software)
          ? productData.software[0] ?? null
          : productData.software ?? null,
      );

      const couponData =
        couponResponse.data ?? couponResponse;

      setCoupons(
        Array.isArray(couponData.coupons)
          ? couponData.coupons
          : [],
      );
    } catch (err) {
      const text =
        err instanceof Error ? err.message : "Could not load admin data";

      setError(text);

      if (/session|login|unauthorized/i.test(text)) {
        await navigate({ to: "/admin/login", replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // Load once when this route opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateCourse(
    productId: Course["productId"],
    field: keyof Course,
    value: unknown,
  ) {
    setCourses((current) =>
      current.map((course) =>
        course.productId === productId
          ? { ...course, [field]: value }
          : course,
      ),
    );
  }

  async function saveCourse(course: Course) {
    setSaving(course.productId);
    setError("");
    setMessage("");

    try {
      await adminApi(
        `/api/admin/products/courses/${course.productId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: course.name,
            description: course.description ?? "",
            price: Number(course.price),
            durationDays: Number(course.durationDays),
            totalSessions: Number(course.totalSessions),
            topics: course.topics,
            active: course.active,
          }),
        },
      );

      setMessage(`${course.name} updated successfully.`);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Course update failed",
      );
    } finally {
      setSaving("");
    }
  }

  async function saveSoftware() {
    if (!software) return;

    setSaving("SOFTWARE");
    setError("");
    setMessage("");

    try {
      await adminApi("/api/admin/products/software/SOFTWARE", {
        method: "PATCH",
        body: JSON.stringify({
          name: software.name,
          description: software.description ?? "",
          price: Number(software.price),
          trialDays: Number(software.trialDays),
          features: software.features,
          active: software.active,
        }),
      });

      setMessage("Software settings updated successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Software update failed",
      );
    } finally {
      setSaving("");
    }
  }

  function toggleCouponProduct(productId: string) {
    setCouponProducts((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  async function createCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving("NEW_COUPON");
    setError("");
    setMessage("");

    try {
      await adminApi("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          products: couponProducts,
          discountAmount: Number(couponDiscount),
          maxUses: Number(couponMaxUses),
          ...(couponExpiry
            ? { expiresAt: new Date(couponExpiry).toISOString() }
            : {}),
          active: true,
        }),
      });

      setCouponCode("");
      setCouponDiscount("2000");
      setCouponMaxUses("0");
      setCouponExpiry("");
      setCouponProducts(["LEVEL_1"]);
      setMessage("Coupon created successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Coupon creation failed",
      );
    } finally {
      setSaving("");
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    setSaving(coupon._id);
    setError("");
    setMessage("");

    try {
      await adminApi(`/api/admin/coupons/${coupon._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !coupon.active }),
      });

      setMessage(
        `${coupon.code} ${coupon.active ? "deactivated" : "activated"}.`,
      );
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Coupon update failed",
      );
    } finally {
      setSaving("");
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-indigo-500";

  const labelClass = "block text-sm text-slate-300";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <h1 className="text-xl font-bold">
              Products & Coupons
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Trillion Trading administration
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                void navigate({ to: "/admin/dashboard" })
              }
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Dashboard
            </button>

            <button
              onClick={() => void loadData()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
            >
              Refresh
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

        {message && (
          <p className="rounded-lg bg-emerald-950 p-4 text-emerald-300">
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-slate-400">Loading products...</p>
        ) : (
          <>
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Course Pricing</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Update course prices and availability.
                </p>
              </div>

              {courses.map((course) => (
                <article
                  key={course.productId}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className={labelClass}>
                      Course Name
                      <input
                        className={inputClass}
                        value={course.name}
                        onChange={(e) =>
                          updateCourse(course.productId, "name", e.target.value)
                        }
                      />
                    </label>

                    <label className={labelClass}>
                      Price (₹)
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        step="1"
                        value={course.price}
                        onChange={(e) =>
                          updateCourse(
                            course.productId,
                            "price",
                            Number(e.target.value),
                          )
                        }
                      />
                    </label>

                    <label className={labelClass}>
                      Duration (days)
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        value={course.durationDays}
                        onChange={(e) =>
                          updateCourse(
                            course.productId,
                            "durationDays",
                            Number(e.target.value),
                          )
                        }
                      />
                    </label>

                    <label className={labelClass}>
                      Total Sessions
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        value={course.totalSessions}
                        onChange={(e) =>
                          updateCourse(
                            course.productId,
                            "totalSessions",
                            Number(e.target.value),
                          )
                        }
                      />
                    </label>
                  </div>

                  <label className={`${labelClass} mt-4`}>
                    Description
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={course.description ?? ""}
                      onChange={(e) =>
                        updateCourse(
                          course.productId,
                          "description",
                          e.target.value,
                        )
                      }
                    />
                  </label>

                  <label className={`${labelClass} mt-4`}>
                    Topics (one per line)
                    <textarea
                      className={inputClass}
                      rows={4}
                      value={course.topics.join("\n")}
                      onChange={(e) =>
                        updateCourse(
                          course.productId,
                          "topics",
                          e.target.value
                            .split("\n")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        )
                      }
                    />
                  </label>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={course.active}
                        onChange={(e) =>
                          updateCourse(
                            course.productId,
                            "active",
                            e.target.checked,
                          )
                        }
                      />
                      Available for purchase
                    </label>

                    <button
                      disabled={saving === course.productId}
                      onClick={() => void saveCourse(course)}
                      className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {saving === course.productId
                        ? "Saving..."
                        : "Save Course"}
                    </button>
                  </div>
                </article>
              ))}

              {courses.length === 0 && (
                <p className="rounded-lg border border-slate-800 p-4 text-slate-400">
                  No courses found. Check whether your backend seed script
                  has been run.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <h2 className="text-lg font-semibold">BUY & SELL Software</h2>

              {software ? (
                <div className="mt-5 space-y-4">
                  <label className={labelClass}>
                    Software Name
                    <input
                      className={inputClass}
                      value={software.name}
                      onChange={(e) =>
                        setSoftware({
                          ...software,
                          name: e.target.value,
                        })
                      }
                    />
                  </label>

                  <label className={labelClass}>
                    Description
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={software.description ?? ""}
                      onChange={(e) =>
                        setSoftware({
                          ...software,
                          description: e.target.value,
                        })
                      }
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className={labelClass}>
                      Price (₹)
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        step="1"
                        value={software.price}
                        onChange={(e) =>
                          setSoftware({
                            ...software,
                            price: Number(e.target.value),
                          })
                        }
                      />
                    </label>

                    <label className={labelClass}>
                      Free Trial (days)
                      <input
                        className={inputClass}
                        type="number"
                        min="0"
                        max="30"
                        value={software.trialDays}
                        onChange={(e) =>
                          setSoftware({
                            ...software,
                            trialDays: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>

                  <label className={labelClass}>
                    Features (one per line)
                    <textarea
                      className={inputClass}
                      rows={4}
                      value={software.features.join("\n")}
                      onChange={(e) =>
                        setSoftware({
                          ...software,
                          features: e.target.value
                            .split("\n")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={software.active}
                      onChange={(e) =>
                        setSoftware({
                          ...software,
                          active: e.target.checked,
                        })
                      }
                    />
                    Available for purchase
                  </label>

                  <button
                    disabled={saving === "SOFTWARE"}
                    onClick={() => void saveSoftware()}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {saving === "SOFTWARE"
                      ? "Saving..."
                      : "Save Software Settings"}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-slate-400">
                  Software record not found.
                </p>
              )}
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Create Coupon</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Fixed-amount discounts for selected products.
                </p>
              </div>

              <form
                onSubmit={createCoupon}
                className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={labelClass}>
                    Coupon Code
                    <input
                      className={inputClass}
                      required
                      minLength={3}
                      maxLength={30}
                      pattern="[A-Za-z0-9_-]+"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Example: SAVE2000"
                    />
                  </label>

                  <label className={labelClass}>
                    Discount Amount (₹)
                    <input
                      className={inputClass}
                      type="number"
                      required
                      min="1"
                      step="1"
                      value={couponDiscount}
                      onChange={(e) => setCouponDiscount(e.target.value)}
                    />
                  </label>

                  <label className={labelClass}>
                    Maximum Uses
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      step="1"
                      value={couponMaxUses}
                      onChange={(e) => setCouponMaxUses(e.target.value)}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      0 means unlimited, according to the backend rules.
                    </span>
                  </label>

                  <label className={labelClass}>
                    Expiry (optional)
                    <input
                      className={inputClass}
                      type="datetime-local"
                      value={couponExpiry}
                      onChange={(e) => setCouponExpiry(e.target.value)}
                    />
                  </label>
                </div>

                <div>
                  <p className="mb-3 text-sm text-slate-300">
                    Products eligible for this coupon
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {productOptions.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-800 p-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={couponProducts.includes(product.id)}
                          onChange={() => toggleCouponProduct(product.id)}
                        />
                        {product.label}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    saving === "NEW_COUPON" ||
                    couponProducts.length === 0
                  }
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold hover:bg-emerald-500 disabled:opacity-50"
                >
                  {saving === "NEW_COUPON"
                    ? "Creating..."
                    : "Create Coupon"}
                </button>
              </form>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 p-5">
                <h2 className="text-lg font-semibold">Existing Coupons</h2>
              </div>

              {coupons.length === 0 ? (
                <p className="p-5 text-slate-400">No coupons created yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="p-4">Code</th>
                        <th className="p-4">Discount</th>
                        <th className="p-4">Usage</th>
                        <th className="p-4">Products</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {coupons.map((coupon) => (
                        <tr key={coupon._id}>
                          <td className="p-4 font-semibold">
                            {coupon.code}
                          </td>
                          <td className="p-4">
                            {money(coupon.discountAmount)}
                          </td>
                          <td className="p-4">
                            {coupon.usedCount} /{" "}
                            {coupon.maxUses === 0
                              ? "Unlimited"
                              : coupon.maxUses}
                          </td>
                          <td className="p-4">
                            {coupon.products.join(", ")}
                          </td>
                          <td className="p-4">
                            {coupon.active ? "Active" : "Inactive"}
                          </td>
                          <td className="p-4">
                            <button
                              disabled={saving === coupon._id}
                              onClick={() => void toggleCoupon(coupon)}
                              className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800 disabled:opacity-50"
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
          </>
        )}
      </div>
    </main>
  );
}
