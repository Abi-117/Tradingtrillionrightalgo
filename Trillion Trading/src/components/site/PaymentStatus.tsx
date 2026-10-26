import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Clock3, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/paymentService";
import { External, PageIntro } from "./shared";
import { site, money } from "@/config/site";
import type { Business } from "@/types/business";
export function PaymentStatus({
  order,
  business,
  failed = false,
}: {
  order: string;
  business: Business;
  failed?: boolean;
}) {
  const q = useQuery({
    queryKey: ["verified-order", business, order],
    queryFn: () => paymentService.getOrder(business, order),
enabled: Boolean(order),
    retry: false,
  });
  const verified = q.data?.verified && q.data.business === business && q.data.orderId === order;
  return (
    <>
      <PageIntro
        eyebrow="PAYMENT STATUS"
        title={
          verified
            ? "Payment verified."
            : failed
              ? "Payment not confirmed."
              : "Awaiting payment verification."
        }
        text="Your purchase is confirmed only after secure payment verification."
      />
      <section className="section">
        <div className="container payment-state">
          {q.isLoading ? (
            <>
              <Clock3 size={42} />
              <h2>Checking your payment…</h2>
            </>
          ) : verified ? (
            <>
              <ShieldCheck size={42} />
              <h2>Thank you for your purchase.</h2>
              <div className="order-summary">
                <div>
                  <span>Purchased</span>
                  <strong>{q.data?.product}</strong>
                </div>
                <div>
                  <span>Amount paid</span>
                  <strong>{money(q.data?.amount ?? 0)}</strong>
                </div>
                <div>
                  <span>Payment reference</span>
                  <strong>{q.data?.paymentId}</strong>
                </div>
                <div>
                  <span>Order reference</span>
                  <strong>{q.data?.orderId}</strong>
                </div>
              </div>
              {q.data?.receiptUrl && (
                <Button asChild variant="outline">
                  <External href={q.data.receiptUrl}>
                    <Download />
                    Download Receipt / Invoice
                  </External>
                </Button>
              )}
              
              


{business === "TRILLION_TRADING" && verified && (
  <Button asChild>
    <External href="https://chat.whatsapp.com/L4ehj6mCbbWJ4lp4F1si9U">
      Join WhatsApp Group
    </External>
  </Button>
)}



              {q.data?.onboarding && <p>{q.data.onboarding}</p>}
              {business === "RIGHT_ALGO_TRADING" && q.data?.product === "REGISTRATION" && (
                <div className="order-summary">
                  <div>
                    <span>Name</span>
                    <strong>{q.data.customer?.name ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Mobile</span>
                    <strong>{q.data.customer?.mobile ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{q.data.customer?.email ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Software</span>
                    <strong>{site.rightSoftware.name}</strong>
                  </div>
                </div>
              )}
              {business === "RIGHT_ALGO_TRADING" && q.data?.product === "REGISTRATION" && (
                <p className="small-note">
                  Your {money(site.right.registrationFee)} registration fee is verified. The{" "}
                  {money(site.rightSoftware.price)} {site.rightSoftware.name} software is a separate
                  purchase and is not included or marked as paid.
                </p>
              )}
             
{business === "RIGHT_ALGO_TRADING" &&
  (q.data?.product === "REGISTRATION" ||
    q.data?.product === "RIGHT_SOFTWARE") && (
  <>
    <Button asChild>
      <External href={site.rightGroup}>
        Join Member WhatsApp Group
      </External>
    </Button>

    <Button asChild variant="outline">
      <External href="https://mynt.zebuetrade.com/login">
        Daily Login
      </External>
    </Button>
  </>
)}

            </>
          ) : (
            <>
              <AlertCircle size={42} />
              <h2>
                {failed
                  ? "Your payment has not been confirmed."
                  : "No verified purchase is available."}
              </h2>
              <p>
                {q.isError
                  ? "We could not verify the payment right now."
                  : !order
                    ? "No order reference was provided."
                    : "Payment verification is unavailable or still pending."}{" "}
                If you were charged, contact the relevant business before paying again.
              </p>
              <Button asChild>
                <Link to="/contact">Contact Payment Support</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </>
  );
}
export function paymentSearch(s: Record<string, unknown>) {
  return {
    order: typeof s['order'] === "string" ? s['order'] : "",
    business: (s['business'] === "RIGHT_ALGO_TRADING"
      ? "RIGHT_ALGO_TRADING"
      : "TRILLION_TRADING") as Business,
  };
}
