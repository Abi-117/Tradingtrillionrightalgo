
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { studentAuthService } from "@/services/studentAuthService";
import { api } from "@/services/apiClient";

type StudentDashboardData = {
  success: boolean;
  student: {
    id: string;
    name: string;
    email: string;
    mobile: string;
  };
  orders: {
    id: string;
    product: string;
    amountPaid: number;
    currency: string;
    paymentStatus: string;
    receiptNumber: string | null;
    createdAt: string;
    business: "TRILLION_TRADING" | "RIGHT_ALGO_TRADING";
  }[];
};

export const Route = createFileRoute("/student-dashboard")({
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
  const navigate = useNavigate();

  const dashboard = useQuery({
    queryKey: ["trillion-student-dashboard"],
    queryFn: () => api<StudentDashboardData>("/api/student/dashboard"),
    retry: false,
  });

  async function handleLogout() {
    try {
      await studentAuthService.logout();
    } finally {
      window.location.assign("/student-login");
    }
  }

  if (dashboard.isLoading) {
    return <main className="mx-auto max-w-3xl p-6">Loading your dashboard...</main>;
  }

  if (dashboard.isError || !dashboard.data?.success) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-bold">Student Login Required</h1>
        <p className="mt-2">Please login to view your Trillion Trading details.</p>
        <button
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => navigate({ to: "/student-login", search: { next: "/student-dashboard" } as never })}
        >
          Go to Login
        </button>
      </main>
    );
  }

  const { student, orders } = dashboard.data;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Student Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Trillion Trading</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border px-4 py-2"
        >
          Logout
        </button>
      </div>

      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">My Profile</h2>
        <div className="mt-4 space-y-2">
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Mobile:</strong> {student.mobile}</p>
        </div>
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">My Payment History</h2>

        {orders.length === 0 ? (
          <p className="mt-4">No Trillion Trading purchases found yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-lg border p-4">
                <p><strong>Product:</strong> {order.product}</p>
                <p><strong>Amount:</strong> ₹{order.amountPaid}</p>
                <p><strong>Status:</strong> {order.paymentStatus}</p>
                <p><strong>Receipt:</strong> {order.receiptNumber || "—"}</p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </p>

                
                
{order.paymentStatus === "PAID" &&
  order.business === "TRILLION_TRADING" &&
  order.product === "SHORT_TERM_BREAKOUT" && (
    <a
      href="https://chartink.com/screener/short-term-breakouts"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-primary-foreground"
    >
      Open Short-Term Breakout Screener ↗
    </a>
  )}

{order.paymentStatus === "PAID" &&
  order.business === "RIGHT_ALGO_TRADING" &&
  (order.product === "REGISTRATION" ||
    order.product === "RIGHT_SOFTWARE") && (
    <a
      href="https://chat.whatsapp.com/Gow1TUSKW8K37rsHQHMAWa"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-primary-foreground"
    >
      Join Right Algo WhatsApp Group
    </a>
  )}

{order.paymentStatus === "PAID" &&
  order.business === "TRILLION_TRADING" &&
  order.product !== "SHORT_TERM_BREAKOUT" &&
  order.product !== "SOFTWARE" && (
    <a
      href="https://chat.whatsapp.com/L4ehj6mCbbWJ4lp4F1si9U"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-primary-foreground"
    >
      Join Course WhatsApp Group
    </a>
  )}



              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
