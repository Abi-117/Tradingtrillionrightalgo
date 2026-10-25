import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Check, Cpu, ShieldCheck, ChartNoAxesCombined, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BackendNotice,
  PageIntro,
  ContactLinks,
  RiskNote,
  SectionHeading,
  Feature,
} from "@/components/site/shared";
import { Checkout, Field, FormMessage, SubmitButton } from "@/components/site/Forms";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { authService } from "@/services/authService";
import { studentAuthService } from "@/services/studentAuthService";
import { paymentService } from "@/services/paymentService";
import { site, money, pageHead } from "@/config/site";
export const Route = createFileRoute("/right-algo-trading")({
  validateSearch: () => ({}),
  head: () =>
    pageHead(
      "Right Algo Trading Registration & Software",
      "Register for Right Algo Trading, review the separate software purchase, join the member WhatsApp group after verified payment, and open Daily Login.",
    ),
  component: RightPage,
});
function RightPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("buy") === "RIGHT_SOFTWARE") {
    setBuyOpen(true);
    params.delete("buy");

    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + (query ? `?${query}` : "") + window.location.hash
    );
  }
}, []);
  
async function submit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  if (busy) return;

  // Read form data before any await.
  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form));

  setMessage("");
  setSuccess(false);
  setBusy(true);

  try {
    let student;

    try {
      const session = await studentAuthService.me();
      student = session.student;
    } catch {
      window.location.assign(
        "/student-login?next=%2Fright-algo-trading"
      );
      return;
    }

    const customer = {
      name: student.name,
      email: student.email,
      mobile: student.mobile,
    };

    const result = await authService.register({
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      experience: String(data["experience"] ?? ""),
      terms: data["terms"] === "accepted",
      risk: data["risk"] === "accepted",
    });

    const order = await paymentService.createOrder(
      "RIGHT_ALGO_TRADING",
      "REGISTRATION",
      customer,
      undefined,
      result.registrationId
    );

    const verified = await paymentService.checkout(order, customer);

    await navigate({
      to: "/payment-success",
      search: {
        business: "RIGHT_ALGO_TRADING",
        order: verified.orderId,
      },
    });
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Your request could not be completed."
    );
  } finally {
    setBusy(false);
  }
}

  return (
    <>
      <PageIntro
        brand="right"
        eyebrow="RIGHT ALGO TRADING"
        title="Automated Trading Solutions for NIFTY and SENSEX"
        text="Explore algorithmic trading solutions designed for NIFTY and SENSEX derivatives, with automated trading workflows and a structured registration process."
      />
      <section className="section right-page-enter">
        <div className="container right-layout">
          <div className="right-intro">
            <div className="eyebrow">RIGHT ALGO TRADING</div>
            <h2>
              Automated trading for
              <br />
              NIFTY and SENSEX.
            </h2>
            <p>
              Algorithmic trading workflows for NIFTY (NFO) and SENSEX (BFO) derivatives — start
              with a one-time registration, then add the dedicated algo software when you are
              ready.
            </p>
            <div className="price-chips">
              <div className="price-chip">
                <span>Software</span>
                <strong>{money(site.rightSoftware.price)}</strong>
                <small>one-time</small>
              </div>
              <div className="price-chip">
                <span>Registration</span>
                <strong>{money(site.right.registrationFee)}</strong>
                <small>one-time</small>
              </div>
            </div>
            <div className="index-pair">
              <div>
                <strong>NIFTY</strong>
                <span>NFO · Auto / Algo Trading</span>
              </div>
              <div>
                <strong>SENSEX</strong>
                <span>BFO · Auto / Algo Trading</span>
              </div>
            </div>
            <div className="accuracy-note">
              <ShieldCheck size={20} />
              <div>
                <strong>Responsible performance disclosure</strong>
                <p>
                  The business advertises {site.right.advertisedAccuracy} accuracy. This range is
                  not independently verified or guaranteed. Actual results vary with market
                  conditions, execution, and strategy.
                </p>
              </div>
            </div>
            <ContactLinks right />
            <RiskNote />
          </div>
          <div className="registration-card right-card-enter">

            <div className="eyebrow">YOUR NEXT STEP</div>
            <h2>Register with Right Algo</h2>
            <p>Complete your details first. No password is required on this registration form.</p>
            <div className="registration-price">
              <span>Registration fee</span>
              <strong>
                {money(site.right.registrationFee)}
                <small>one-time</small>
              </strong>
            </div>
            <form onSubmit={submit}>
              <Field label="Full Name" name="name" required />
              <div className="form-grid">
                <Field label="Mobile Number" name="mobile" type="tel" required />
                <Field label="Email Address" name="email" type="email" required />
              </div>
              <Field label="Trading Experience (optional)" name="experience" required={false}>
                <select name="experience" defaultValue="">
                  <option value="">Select experience (optional)</option>
                  <option>New to trading</option>
                  <option>Less than 1 year</option>
                  <option>1–3 years</option>
                  <option>More than 3 years</option>
                </select>
              </Field>
              <label className="checkbox-label">
                <input type="checkbox" name="terms" value="accepted" required />
                <span>
                  I accept the{" "}
                  <Link to="/policies/$policy" params={{ policy: "terms" }}>
                    Terms &amp; Conditions
                  </Link>.
                </span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" name="risk" value="accepted" required />
                <span>
                  I have read the{" "}
                  <Link to="/policies/$policy" params={{ policy: "risk" }}>
                    Risk Disclosure
                  </Link>{" "}
                  and understand trading risks.
                </span>
              </label>
              <FormMessage message={message} success={success} />
              <SubmitButton busy={busy}>
                {`Pay ${money(site.right.registrationFee)} & Register`}
              </SubmitButton>
              <p className="secure-caption">
                <ShieldCheck size={14} />
                Right Algo Trading’s dedicated payment account
              </p>
            </form>
            <BackendNotice />
            <p className="small-note">
              The {money(site.right.registrationFee)} registration fee is separate from the{" "}
              {money(site.rightSoftware.price)} {site.rightSoftware.name} software purchase and
              does not mark the software as paid. The WhatsApp group button appears only after your
              registration payment is verified.
            </p>
            <p className="small-note">
              After your registration payment is verified, the success page will show the member
              WhatsApp group link. Software is a separate purchase and must be verified separately.
            </p>
          </div>
        </div>
      </section>
      <section className="section section-muted right-page-enter" id="daily-login">
        <div className="container">
          <div className="registration-card right-card-enter">
            <div className="eyebrow">EXISTING USERS</div>
            <h2>Daily Login</h2>
            <p>
              Already have your Right Algo platform login details? Open the trading platform using
              the official login page below. Registration on this website does not automatically
              create or sign you in to the external platform.
            </p>
            <Button asChild size="lg" className="action">
              <a href="https://mynt.zebuetrade.com/login" target="_blank" rel="noreferrer">
                Open Daily Login <ExternalLink size={17} />
              </a>
            </Button>
          </div>
        </div>
      </section>
      <section className="section right-page-enter" id="software">
        <div className="container right-software">
          <div>
            <div className="eyebrow">SOFTWARE</div>
            <h2>{site.rightSoftware.name}</h2>
            <p>
              Algorithmic trading software for NIFTY and SENSEX derivatives, with automated
              execution where broker integration is supported.
            </p>
            <ul className="check-list">
              {[
                "NIFTY (NFO) Auto Trading / Algo Trading",
                "SENSEX (BFO) Auto Trading / Algo Trading",
                "Automated order execution, where supported",
                "Real-time market monitoring",
                "Risk management controls",
                "Member onboarding and support",
              ].map((t) => (
                <li key={t}>
                  <Check />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="registration-card">
            <div className="eyebrow">SOFTWARE PRICE</div>
            <div className="registration-price">
              <span>{site.rightSoftware.name}</span>
              <strong>
                {money(site.rightSoftware.price)}
                <small>software</small>
              </strong>
            </div>
            <p className="small-note">
              Have a redemption code? Enter it at checkout — the discount applies only after
              verification. This purchase is separate from the{" "}
              {money(site.right.registrationFee)} registration fee; registering does not include
              the software, and buying the software does not include registration.
            </p>
            <Button size="lg" className="action" onClick={() => setBuyOpen(true)}>
              Buy Software
            </Button>
            <p className="secure-caption">
              <ShieldCheck size={14} />
              Right Algo Trading’s dedicated payment account
            </p>
          </div>
        </div>
      </section>
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="form-dialog">
          <DialogTitle className="sr-only">RIGHT ALGO TRADING Software Checkout</DialogTitle>
          {buyOpen && (
            <Checkout
              product="RIGHT_SOFTWARE"
              business="RIGHT_ALGO_TRADING"
              onClose={() => setBuyOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      <section className="section section-muted right-page-enter">
        <div className="container">
          <div className="trillion-mini-card right-card-enter">
            <div>
              <div className="eyebrow">ALSO FROM OUR TEAM</div>
              <h2>Trillion Trading</h2>
              <p>Explore our separate trading courses and BUY/SELL software.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/trillion-trading">
                Explore Trillion Trading <ArrowRight size={17} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="section section-muted right-page-enter">
        <div className="container">
          <SectionHeading eyebrow="FOR VERIFIED MEMBERS" title="A clear path to getting started." />
          <div className="three-grid">
            <Feature icon={ShieldCheck} title="Register & verify">
              Complete your details and have your registration payment verified.
            </Feature>
            <Feature icon={Cpu} title="Software onboarding">
              Get onboarding guidance after the relevant registration and purchase checks are complete.
            </Feature>
            <Feature icon={ChartNoAxesCombined} title="Stay connected">
              Eligible members can join the Right Algo WhatsApp group and get support.
            </Feature>
          </div>
        </div>
      </section>
      <style>{`
        .right-page-enter { animation: rightPageFadeUp 650ms ease-out both; }
        .right-card-enter { animation: rightCardFadeUp 750ms ease-out both; }
        .trillion-mini-card {
          display: flex; align-items: center; justify-content: space-between;
          gap: 1.5rem; padding: clamp(1.25rem, 3vw, 2rem);
          border: 1px solid var(--border, rgba(127,127,127,.25));
          border-radius: 1rem; background: var(--card, transparent);
        }
        .trillion-mini-card h2 { margin: .35rem 0; }
        .trillion-mini-card p { margin: 0; max-width: 42rem; }
        #daily-login .registration-card { max-width: 760px; margin-inline: auto; }
        @keyframes rightPageFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rightCardFadeUp {
          from { opacity: 0; transform: translateY(18px) scale(.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .right-page-enter, .right-card-enter { animation: none; }
        }
        @media (max-width: 640px) {
          .trillion-mini-card { align-items: flex-start; flex-direction: column; }
        }
      `}</style>
    </>
  );
}
