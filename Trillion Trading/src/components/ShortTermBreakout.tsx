
import { useState } from "react";

type PaymentOrder = {
  success: boolean;
  internalOrderId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  productName: string;
};

type Props = {
  apiBaseUrl?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export default function ShortTermBreakout({
  apiBaseUrl = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [message, setMessage] = useState("");

  async function buyScreener() {
    setLoading(true);
    setMessage("");

    try {
      // Load Razorpay Checkout if it isn't already loaded.
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(
            new Error("Unable to load Razorpay checkout.")
          );
          document.body.appendChild(script);
        });
      }

      // Create the order on your backend.
      const response = await fetch(
        `${apiBaseUrl}/api/trillion/payments/create-order`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: "SHORT_TERM_BREAKOUT",
          }),
        }
      );

      const order = await response.json();

if (!response.ok || !order.success) {
  console.error("Create order failed:", {
    status: response.status,
    response: order,
  });

  throw new Error(
    order.message ||
    order.error ||
    `Create order failed: HTTP ${response.status}`
  );
}

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is unavailable.");
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Trillion Trading",
        description: "Short-Term Breakout Screener Access",
        order_id: order.orderId,

        handler: async (payment: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await fetch(
              `${apiBaseUrl}/api/trillion/payments/verify`,
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(payment),
              }
            );

            const result = await verifyResponse.json();

            if (!verifyResponse.ok || !result.verified) {
              throw new Error("Payment verification failed.");
            }

            // Only enable access after server-side verification.
            const accessResponse = await fetch(
              `${apiBaseUrl}/api/trillion/payments/screener-access`,
              { credentials: "include" }
            );

            const access = await accessResponse.json();

            if (!accessResponse.ok || !access.hasAccess) {
              throw new Error("Payment verified, but access could not be loaded. Please contact support.");
            }

            setHasAccess(true);
            setMessage("Payment verified successfully!");
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Unable to verify payment."
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: { color: "#7C3AED" },
      });

      checkout.open();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start payment."
      );
      setLoading(false);
    }
  }

  async function openScreener() {
    setMessage("");

    try {
      // Re-check entitlement on the backend every time.
      const response = await fetch(
        `${apiBaseUrl}/api/trillion/payments/screener-access`,
        { credentials: "include" }
      );

      const result = await response.json();

      if (!response.ok || !result.hasAccess || !result.screenerUrl) {
        setHasAccess(false);
        throw new Error("Screener access is not available for this account.");
      }

      window.open(
        result.screenerUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to open screener."
      );
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <div className="overflow-hidden rounded-3xl border border-violet-200 bg-slate-950 text-white shadow-xl">
        <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1 text-sm text-violet-200">
              TRILLION TRADING
            </span>

            <h2 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl">
              Short-Term Breakout Screener
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              Explore a Chartink screener designed to identify
              stocks matching short-term breakout conditions.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              <li>✓ Access to the specified screener link</li>
              <li>✓ Convenient access from your account</li>
              <li>✓ One-time payment: ₹999</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-300">
              Screener Access
            </p>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold">₹999</span>
              <span className="text-sm text-slate-400">
                one-time
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-400">
              Payment must be verified before access is granted.
            </p>

            {hasAccess ? (
              <button
                onClick={openScreener}
                className="mt-6 w-full rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white hover:bg-violet-400"
              >
                Open Screener ↗
              </button>
            ) : (
              <button
                onClick={buyScreener}
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : "Buy Now — ₹999"}
              </button>
            )}

            {message && (
              <p
                role="status"
                className="mt-4 text-sm text-violet-200"
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Disclaimer: This screener is a stock-screening tool, not
        investment advice or a guarantee of returns. Verify all
        trading decisions independently.
      </p>
    </section>
  );
}
