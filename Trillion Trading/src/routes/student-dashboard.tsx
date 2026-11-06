
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
    business?: string;
  }[];
};

type AutoPaySubscription = {
  _id: string;
  business: string;
  product: string;
  monthlyAmount: number;
  currency: string;
  status: string;
  nextBillingAt: string | null;
  lastPaidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  razorpaySubscriptionId: string;
};

type AutoPayPayment = {
  business: string;
  razorpaySubscriptionId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  currency: string;
  status: string;
  paidAt: string;
};

type AutoPaySubscriptionsResponse = {
  success: boolean;
  subscriptions: AutoPaySubscription[];
};

type AutoPayPaymentsResponse = {
  success: boolean;
  payments: AutoPayPayment[];
};

export const Route = createFileRoute("/student-dashboard")({
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const dashboard = useQuery({
    queryKey: ["trillion-student-dashboard"],
    queryFn: () => api<StudentDashboardData>("/api/student/dashboard"),
    retry: false,
  });

  const autoPaySubscriptions = useQuery({
    queryKey: ["auto-pay-subscriptions"],
    queryFn: () =>
      api<AutoPaySubscriptionsResponse>(
        "/api/auto-pay/my-subscriptions"
      ),
    enabled: !!dashboard.data?.success,
    retry: false,
  });

  const autoPayPayments = useQuery({
    queryKey: ["auto-pay-payments"],
    queryFn: () =>
      api<AutoPayPaymentsResponse>("/api/auto-pay/my-payments"),
    enabled: !!dashboard.data?.success,
    retry: false,
  });

  async function handleLogout() {
    try {
      await studentAuthService.logout();
    } finally {
      window.location.assign("/student-login");
    }
  }

  async function handleCancelAutoPay(subscription: AutoPaySubscription) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel AutoPay for ${subscription.product}?`
    );

    if (!confirmed) return;

    try {
      await api("/api/auto-pay/cancel-subscription", {
        method: "POST",
        body: JSON.stringify({
          business: subscription.business,
          subscriptionId: subscription.razorpaySubscriptionId,
        }),
      });

      window.alert("AutoPay cancellation request completed.");

      await queryClient.invalidateQueries({
        queryKey: ["auto-pay-subscriptions"],
      });
    } catch (error) {
      console.error("AutoPay cancellation error:", error);
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to cancel AutoPay. Please try again."
      );
    }
  }

  if (dashboard.isLoading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        Loading your dashboard...
      </main>
    );
  }

  if (dashboard.isError || !dashboard.data?.success) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-bold">Student Login Required</h1>

        <p className="mt-2">
          Please login to view your trading details.
        </p>

        <button
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          onClick={() =>
            navigate({
              to: "/student-login",
              search: { next: "/student-dashboard" } as never,
            })
          }
        >
          Go to Login
        </button>
      </main>
    );
  }

  const { student, orders } = dashboard.data;
  const subscriptions = autoPaySubscriptions.data?.subscriptions ?? [];
  const recurringPayments = autoPayPayments.data?.payments ?? [];

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Student Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Trading Account</p>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg border px-4 py-2"
        >
          Logout
        </button>
      </div>

      {/* Student Profile */}
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">My Profile</h2>

        <div className="mt-4 space-y-2">
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Mobile:</strong> {student.mobile}</p>
        </div>
      </section>

      {/* AutoPay Subscriptions */}
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">My AutoPay Subscriptions</h2>

        {autoPaySubscriptions.isLoading ? (
          <p className="mt-4">Loading AutoPay subscriptions...</p>
        ) : autoPaySubscriptions.isError ? (
          <p className="mt-4 text-sm text-red-600">
            Unable to load AutoPay subscriptions.
          </p>
        ) : subscriptions.length === 0 ? (
          <p className="mt-4">No AutoPay subscriptions found.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {subscriptions.map((subscription) => {
              const canCancel = [
                "ACTIVE",
                "PENDING_AUTH",
                "HALTED",
              ].includes(subscription.status);

              return (
                <article
                  key={subscription._id}
                  className="rounded-lg border p-4"
                >
                  <p><strong>Business:</strong> {subscription.business}</p>
                  <p><strong>Product:</strong> {subscription.product}</p>
                  <p>
                    <strong>Monthly Amount:</strong>{" "}
                    ₹{subscription.monthlyAmount}
                  </p>
                  <p>
                    <strong>Status:</strong> {subscription.status}
                  </p>
                  <p>
                    <strong>Next Billing:</strong>{" "}
                    {subscription.nextBillingAt
                      ? new Date(subscription.nextBillingAt).toLocaleDateString("en-IN")
                      : "Not scheduled"}
                  </p>
                  <p>
                    <strong>Last Payment:</strong>{" "}
                    {subscription.lastPaidAt
                      ? new Date(subscription.lastPaidAt).toLocaleDateString("en-IN")
                      : "No recurring payment yet"}
                  </p>

                  {canCancel && (
                    <button
                      onClick={() => handleCancelAutoPay(subscription)}
                      className="mt-3 rounded-lg border border-red-500 px-4 py-2 text-red-600"
                    >
                      Cancel AutoPay
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Recurring AutoPay Payment History */}
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">
          Monthly AutoPay Payment History
        </h2>

        {autoPayPayments.isLoading ? (
          <p className="mt-4">Loading recurring payments...</p>
        ) : autoPayPayments.isError ? (
          <p className="mt-4 text-sm text-red-600">
            Unable to load recurring payment history.
          </p>
        ) : recurringPayments.length === 0 ? (
          <p className="mt-4">No recurring payments found yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recurringPayments.map((payment) => (
              <article
                key={payment.razorpayPaymentId}
                className="rounded-lg border p-4"
              >
                <p><strong>Business:</strong> {payment.business}</p>
                <p>
                  <strong>Amount:</strong>{" "}
                  ₹{(payment.amountPaise / 100).toFixed(2)}
                </p>
                <p><strong>Status:</strong> {payment.status}</p>
                <p>
                  <strong>Payment Date:</strong>{" "}
                  {new Date(payment.paidAt).toLocaleDateString("en-IN")}
                </p>
                <p className="break-all text-sm">
                  <strong>Payment ID:</strong> {payment.razorpayPaymentId}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Existing One-Time Payment History */}
      <section className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">My Payment History</h2>

        {orders.length === 0 ? (
          <p className="mt-4">No purchases found yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {orders.map((order) => {
              const business = String(order.business ?? "").trim().toUpperCase();
              const product = String(order.product ?? "").trim().toUpperCase();
              const status = String(order.paymentStatus ?? "").trim().toUpperCase();

              const isTrillion = business === "TRILLION_TRADING";
              const isRightAlgo = business === "RIGHT_ALGO_TRADING";

              const showScreener =
                status === "PAID" &&
                isTrillion &&
                product === "SHORT_TERM_BREAKOUT";

              const showRightAlgoWhatsApp =
                status === "PAID" &&
                isRightAlgo &&
                ["REGISTRATION", "RIGHT_SOFTWARE"].includes(product);

              const showTrillionWhatsApp =
                status === "PAID" &&
                isTrillion &&
                product !== "SHORT_TERM_BREAKOUT";

              return (
                <article key={order.id} className="rounded-lg border p-4">
                  <p><strong>Product:</strong> {order.product}</p>
                  <p><strong>Amount:</strong> ₹{order.amountPaid}</p>
                  <p><strong>Status:</strong> {order.paymentStatus}</p>
                  <p>
                    <strong>Receipt:</strong> {order.receiptNumber || "—"}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </p>

                  {showScreener && (
                    <a
                      href="https://chartink.com/screener/short-term-breakouts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                    >
                      Open Short-Term Breakout Screener ↗
                    </a>
                  )}

                  {showRightAlgoWhatsApp && (
                    <a
                      href="https://chat.whatsapp.com/Gow1TUSKW8K37rsHQHMAWa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                    >
                      Join Right Algo WhatsApp Group
                    </a>
                  )}

                  {showTrillionWhatsApp && (
                    <a
                      href="https://chat.whatsapp.com/L4ehj6mCbbWJ4lp4F1si9U"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex rounded-lg bg-primary px-4 py-2 text-primary-foreground"
                    >
                      Join Trillion Trading WhatsApp Group
                    </a>
                  )}

                  {status === "PAID" &&
                    !showScreener &&
                    !showRightAlgoWhatsApp &&
                    !showTrillionWhatsApp && (
                      <p className="mt-3 rounded-lg border border-amber-500 p-3 text-sm">
                        Access link could not be matched. Business:{" "}
                        {order.business || "Missing"}, Product:{" "}
                        {order.product || "Missing"}, Status:{" "}
                        {order.paymentStatus || "Missing"}.
                      </p>
                    )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
