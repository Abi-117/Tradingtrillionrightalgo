import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, ShieldCheck, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/paymentService";
import { site, money } from "@/config/site";
import type { Business, Product } from "@/types/business";
import { studentAuthService } from "@/services/studentAuthService";
import type { Student } from "@/services/studentAuthService";
export function Field({
  label,
  name,
  type = "text",
  required = true,
  children,
  placeholder,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  children?: ReactNode;
  placeholder?: string;
  minLength?: number;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {!required && <small> (optional)</small>}
      </span>
      {children ?? (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          minLength={minLength}
          autoComplete={
            type === "password"
              ? "new-password"
              : name === "email"
                ? "email"
                : name === "mobile"
                  ? "tel"
                  : name === "name"
                    ? "name"
                    : undefined
          }
          pattern={name === "mobile" ? "\\+?[0-9\\s\\-]{10,15}" : undefined}
        />
      )}
    </label>
  );
}
export function FormMessage({ message, success = false }: { message: string; success?: boolean }) {
  return message ? (
    <div
      role={success ? "status" : "alert"}
      className={success ? "form-message success" : "form-message"}
    >
      <AlertCircle size={17} />
      {message}
    </div>
  ) : null;
}
export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" className="action form-submit" disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : null}
      {busy ? "Please wait…" : children}
      {!busy && <ArrowRight size={17} />}
    </Button>
  );
}
export function Checkout({
  product,
  onClose,
  business = "TRILLION_TRADING",
}: {
  product: Product;
  onClose: () => void;
  business?: Business;
}) {
  const navigate = useNavigate();
  const prices = {
    LEVEL_1: site.course.level1,
    LEVEL_2: site.course.level2,
    COURSE_PACKAGE: site.course.package,
    SOFTWARE: site.software.price,
    REGISTRATION: site.right.registrationFee,
    RIGHT_SOFTWARE: site.rightSoftware.price,
  };
  const titles = {
    LEVEL_1: "Level 1 — Basic Trading Foundations",
    LEVEL_2: "Level 2 — Advanced Trading Analysis",
    COURSE_PACKAGE: "Full Course — Multi Timeframe Analysis",
    SOFTWARE: "BUY and SELL Software",
    REGISTRATION: "Right Algo Registration",
    RIGHT_SOFTWARE: "RIGHT ALGO TRADING Software",
  };
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{
    code: string;
    discount: number;
    payableAmount: number;
    originalAmount: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function apply() {
    setBusy(true);
    setMessage("");
    try {
      const result = await paymentService.validateCoupon(business, product, code.trim());
      if (!result.valid) throw new Error(result.message ?? "This code is invalid or expired.");
      setCoupon(result);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Coupon could not be checked.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget);
    const customer = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      mobile: String(form.get("mobile")),
    };
    try {
      const order = await paymentService.createOrder(
        business,
        product,
        customer,
        coupon?.code,
      );
      const verified = await paymentService.checkout(order, customer);
      onClose();
      await navigate({
        to: "/payment-success",
        search: { order: verified.orderId, business },
      });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Payment could not be started.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="checkout-content">
      <div className="eyebrow">SECURE ENROLMENT</div>
      <h2>{titles[product]}</h2>
      <p>Your final price and any redemption code are verified before payment.</p>
      <form onSubmit={submit}>
        <Field label="Full Name" name="name" />
        <div className="form-grid">
          <Field label="Email Address" name="email" type="email" />
          <Field label="Mobile Number" name="mobile" type="tel" />
        </div>
        <label className="field">
          <span>
            Redemption code <small>(optional)</small>
          </span>
          <div className="coupon-input">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your redemption code"
              disabled={Boolean(coupon) || busy}
            />
            <Button
              type="button"
              variant="outline"
              onClick={apply}
              disabled={!code.trim() || busy || Boolean(coupon)}
            >
              Apply Coupon
            </Button>
          </div>
        </label>
        {coupon && (
          <div className="coupon-applied">
            <CheckMark />
            Applied: {coupon.code}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setCoupon(null);
                setCode("");
              }}
            >
              Remove Coupon
              <X size={13} />
            </Button>
          </div>
        )}
        <div className="order-summary">
          <div>
            <span>Original price</span>
            <strong>{money(coupon?.originalAmount ?? prices[product])}</strong>
          </div>
          <div>
            <span>Discount</span>
            <strong>{coupon ? `− ${money(coupon.discount)}` : "—"}</strong>
          </div>
          <div className="total">
            <span>{coupon ? "Verified payable amount" : "Estimated payable amount"}</span>
            <strong>{money(coupon?.payableAmount ?? prices[product])}</strong>
          </div>
        </div>
        <p className="small-note">
          Coupons cannot be combined. Eligibility and final prices are determined by the payment
          service.{" "}
          {product === "RIGHT_SOFTWARE"
            ? "A discount applies only after the backend confirms your redemption code. This purchase is separate from the ₹2,000 registration fee."
            : product === "SOFTWARE"
            ? "An eligible software-only ₹5,000 coupon brings the price to ₹4,999."
            : "Full package coupons: ₹5,000 off (₹30,000) or ₹2,000 off (₹33,000). Individual level eligibility is verified separately."}
        </p>
        <FormMessage message={message} />
        <SubmitButton busy={busy}>Continue to Payment</SubmitButton>
        <div className="secure-caption">
          <ShieldCheck size={14} />
          Razorpay · {business === "RIGHT_ALGO_TRADING" ? "Right Algo Trading" : "Trillion Trading"} account · Verified payments
        </div>
      </form>
    </div>
  );
}
function CheckMark() {
  return <ShieldCheck size={16} />;
}
