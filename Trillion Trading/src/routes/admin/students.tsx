
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";

export const Route = createFileRoute("/admin/students")({
  component: AdminStudentsPage,
});

type Business = "ALL" | "TRILLION_TRADING" | "RIGHT_ALGO_TRADING";


type StudentOrder = {
  id: string;
  business: string;
  product: string;
  payableAmount?: number;
  amountPaise?: number;
  currency?: string;
  paymentStatus: string;
  receiptNumber?: string;
  createdAt: string;
  verifiedAt?: string;
};

type Student = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  registeredAt: string;
  orders: StudentOrder[];
  registrations: RightAlgoRegistration[];
};
type RightAlgoRegistration = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  experience?: string;
  termsAccepted: boolean;
  riskAccepted: boolean;
  paymentStatus: "PENDING" | "PAID";
  registrationOrderId?: string | null;
  registrationPaymentId?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
};

type StudentsResponse = {
  success: boolean;
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN");
}

function formatAmount(order: StudentOrder) {
  const amount =
    typeof order.payableAmount === "number"
      ? order.payableAmount
      : typeof order.amountPaise === "number"
        ? order.amountPaise / 100
        : 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: order.currency || "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [business, setBusiness] = useState<Business>("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStudents(
    selectedBusiness: Business = business,
    selectedPage: number = page,
  ) {
    setLoading(true);
    setError("");

    try {
      const result = await adminApi<StudentsResponse>(
        `/api/admin/dashboard/students?page=${selectedPage}&limit=20&business=${selectedBusiness}`,
      );

      if (!result.success) {
        throw new Error(result.message || "Unable to load student details.");
      }

      setStudents(result.students || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(Math.max(1, result.pagination?.totalPages || 1));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load student details.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents(business, page);
    // Load when the selected business or page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business, page]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-emerald-400">
              ADMIN CONTROL PANEL
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Student Login Details
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              View student accounts and their linked purchases.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.assign("/admin/")}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Back to Admin
            </button>

            <button
              type="button"
              onClick={() => void loadStudents(business, page)}
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Student Accounts</p>
            <p className="mt-2 text-3xl font-bold">{total}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Students on This Page</p>
            <p className="mt-2 text-3xl font-bold">{students.length}</p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Student Accounts</h2>

            <select
              value={business}
              onChange={(event) => {
                setBusiness(event.target.value as Business);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              aria-label="Filter by business"
            >
              <option value="ALL">All Businesses</option>
              <option value="TRILLION_TRADING">Trillion Trading</option>
              <option value="RIGHT_ALGO_TRADING">Right Algo Trading</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <p className="py-10 text-center text-slate-400">
              Loading student details...
            </p>
          ) : students.length === 0 ? (
            <p className="py-10 text-center text-slate-400">
              No student accounts found.
            </p>
          ) : (
            <div className="space-y-4">
              {students.map((student) => {
                const visibleOrders = student.orders.filter(
                  (order) =>
                    business === "ALL" || order.business === business,
                );

                return (
                  <article
                    key={student.id}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {student.name}
                        </h3>
                        <p className="mt-1 break-all text-sm text-slate-300">
                          {student.email}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Mobile: {student.mobile}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          student.isActive
                            ? "bg-emerald-950 text-emerald-300"
                            : "bg-red-950 text-red-300"
                        }`}
                      >
                        {student.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-slate-900 p-3">
                        <p className="text-slate-400">Registered</p>
                        <p className="mt-1">{formatDate(student.registeredAt)}</p>
                      </div>

                      <div className="rounded-lg bg-slate-900 p-3">
                        <p className="text-slate-400">Last Login</p>
                        <p className="mt-1">{formatDate(student.lastLoginAt)}</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <h4 className="mb-3 font-semibold">
                        Purchase Details ({visibleOrders.length})
                      </h4>

                      {visibleOrders.length === 0 ? (
                        <p className="rounded-lg bg-slate-900 p-3 text-sm text-slate-400">
                          No linked purchases for this business.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="text-slate-400">
                              <tr className="border-b border-slate-800">
                                <th className="px-3 py-3">Business</th>
                                <th className="px-3 py-3">Product</th>
                                <th className="px-3 py-3">Amount</th>
                                <th className="px-3 py-3">Payment</th>
                                <th className="px-3 py-3">Date</th>
                              </tr>
                            </thead>

                            <tbody>
                              {visibleOrders.map((order) => (
                                <tr
                                  key={order.id}
                                  className="border-b border-slate-800 last:border-0"
                                >
                                  <td className="px-3 py-3">
                                    {order.business === "TRILLION_TRADING"
                                      ? "Trillion Trading"
                                      : "Right Algo Trading"}
                                  </td>
                                  <td className="px-3 py-3">
                                    {order.product || "—"}
                                  </td>
                                  <td className="px-3 py-3">
                                    {formatAmount(order)}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">
                                      {order.paymentStatus}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3">
                                    {formatDate(order.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    
                    {business !== "TRILLION_TRADING" && (
                      <div className="mt-5">
                        <h4 className="mb-3 font-semibold">
                          Right Algo Registrations (
                          {student.registrations?.length || 0})
                        </h4>

                        {!student.registrations?.length ? (
                          <p className="rounded-lg bg-slate-900 p-3 text-sm text-slate-400">
                            No linked Right Algo registrations found.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {student.registrations.map((registration) => (
                              <div
                                key={registration.id}
                                className="rounded-lg border border-slate-800 bg-slate-900 p-4"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="font-medium">
                                    {registration.name}
                                  </p>

                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                      registration.paymentStatus === "PAID"
                                        ? "bg-emerald-950 text-emerald-300"
                                        : "bg-amber-950 text-amber-300"
                                    }`}
                                  >
                                    {registration.paymentStatus}
                                  </span>
                                </div>

                                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                                  <p className="text-slate-300">
                                    Email: {registration.email}
                                  </p>

                                  <p className="text-slate-300">
                                    Mobile: {registration.mobile}
                                  </p>

                                  <p className="text-slate-300">
                                    Experience: {registration.experience || "—"}
                                  </p>

                                  <p className="text-slate-300">
                                    Registered: {formatDate(registration.createdAt)}
                                  </p>

                                  <p className="text-slate-300">
                                    Payment verified: {formatDate(registration.verifiedAt)}
                                  </p>

                                  <p className="text-slate-300">
                                    Terms accepted: {registration.termsAccepted ? "Yes" : "No"}
                                  </p>

                                  <p className="text-slate-300">
                                    Risk declaration accepted: {registration.riskAccepted ? "Yes" : "No"}
                                  </p>

                                  <p className="break-all text-slate-300">
                                    Registration Order ID: {registration.registrationOrderId || "—"}
                                  </p>

                                  <p className="break-all text-slate-300 sm:col-span-2">
                                    Payment ID: {registration.registrationPaymentId || "—"}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </article>
                  
                );
              })}

              
            </div>
          )}

          {!loading && total > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
              <p className="text-sm text-slate-400">
                Page {page} of {totalPages} · {total} students
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
