import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import ShortTermBreakout from "@/components/ShortTermBreakout";
import {
  Check,
  ArrowRight,
  Cpu,
  Clock3,
  ShieldCheck,
  TrendingUp,
  Gem,
  Globe2,
  Bitcoin,
  ChartNoAxesCombined,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  BackendNotice,
  ContactBand,
  ContactLinks,
  PageIntro,
  RiskNote,
  SectionHeading,
  Feature,
  LearningHighlights,
} from "@/components/site/shared";
import software from "@/assets/software.png";
import { ChartDemo } from "@/components/site/ChartDemo";
import { Checkout, Field, FormMessage, SubmitButton } from "@/components/site/Forms";
import { site, money, level1Topics, level2Topics, softwareFeatures, pageHead } from "@/config/site";
import { softwareService } from "@/services/softwareService";
import type { Product } from "@/types/business";
export const Route = createFileRoute("/trillion-trading")({
  head: () =>
    pageHead(
      "Trillion Trading Courses & Software",
      "Explore the complete 30-day Multi Timeframe Analysis course, two learning levels, BUY and SELL Software, and a three-day free trial.",
    ),
  component: TrillionPage,
});
function TrillionPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [trialOpen, setTrialOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const buy = params.get("buy");

  if (
    buy === "LEVEL_1" ||
    buy === "LEVEL_2" ||
    buy === "COURSE_PACKAGE" ||
    buy === "SOFTWARE"
  ) {
    setProduct(buy);
    params.delete("buy");

    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname + (query ? `?${query}` : "") + window.location.hash
    );
  }
}, []);

  async function trial(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setSuccess(false);
    try {
      const result = await softwareService.requestTrial(
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      setMessage(
        result.message ||
          "Your request has been received for review. Trial access is subject to approval.",
      );
      setSuccess(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageIntro
        brand="trillion"
        eyebrow="EDUCATION. ANALYSIS. TECHNOLOGY."
        title="Trillion Trading"
        text="Build a stronger trading foundation. Explore the technology that supports it."
      />
      <div className="section-tabs">
        <div className="container">
          <a href="#course">Trading Course</a>
          <a href="#software">BUY and SELL Software</a>
          <a href="#trial">Free Trial</a>
          <a href="#trillion-contact">Contact</a>
        </div>
      </div>
      <section id="course" className="section">
        <div className="container">
          <SectionHeading
            eyebrow="THE COURSE"
            title="Multi Timeframe Analysis"
            text="A structured trading education program covering technical analysis, candlestick patterns, support and resistance, indicators, price action, trade management, and advanced multi-timeframe analysis."
          />
          <div className="course-facts">
            <span>
              <Clock3 size={20} />
              <strong>30 Days</strong>Course duration
            </span>
            <span>
              <ChartNoAxesCombined size={20} />
              <strong>30 Sessions</strong>Total sessions
            </span>
            <span>
              <TrendingUp size={20} />
              <strong>2 Levels</strong>Foundations to advanced
            </span>
            <span>
              <ShieldCheck size={20} />
              <strong>₹35,000</strong>Total course fee
            </span>
          </div>
          <div className="course-grid">
            {[
              {
                level: 1,
                title: "Basic Trading Foundations",
                fee: site.course.level1,
                topics: level1Topics,
                product: "LEVEL_1" as const,
              },
              {
                level: 2,
                title: "Advanced Trading Analysis",
                fee: site.course.level2,
                topics: level2Topics,
                product: "LEVEL_2" as const,
              },
            ].map((c) => (
              <article className={`course-card level-${c.level}`} key={c.level}>
                <div className="eyebrow">LEVEL {c.level}</div>
                <h3>{c.title}</h3>
                <div className="course-price">
                  {money(c.fee)}
                  <span>per level</span>
                </div>
                <ul className="check-list">
                  {c.topics.map((t) => (
                    <li key={t}>
                      <Check />
                      {t}
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="action" onClick={() => setProduct(c.product)}>
                  Enrol Now
                  <ArrowRight size={17} />
                </Button>
              </article>
            ))}
          </div>
          <div className="package-row">
            <div>
              <h3>The complete learning journey</h3>
              <p>Level 1 + Level 2 · 30 days · 30 sessions</p>
            </div>
            <strong>{money(site.course.package)}</strong>
            <Button size="lg" onClick={() => setProduct("COURSE_PACKAGE")}>
              Enrol in Full Course
              <ArrowRight size={17} />
            </Button>
          </div>
          <p className="small-note">
            Pricing note: the separately priced levels total ₹34,998 (₹14,999 + ₹19,999), while the
            advertised full course package fee is ₹35,000. Both supplied prices are displayed
            pending final business confirmation.
          </p>
         
          <BackendNotice />
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <LearningHighlights />
        </div>
      </section>
      <section className="section" id="software">
        <div className="container">
          <div className="software-home">
            <div>
              <div className="eyebrow">TRILLION TRADING TECHNOLOGY</div>
              <h2>BUY and SELL Software</h2>
              <p>
                Our Trading Software & Algo helps you trade smarter with Smart Algorithms, Accurate
                Signals, Auto Execution, Real-Time Analysis and Risk Management.
              </p>
              <p>
                It supports Gold, Forex, Crypto, Equity, Futures & Options and comes with a simple,
                user-friendly interface.
              </p>
              <div className="software-price">
  <strong>{money(site.software.price)}</strong>
</div>
              <Button size="lg" className="action" onClick={() => setProduct("SOFTWARE")}>
                Buy Software
                <ArrowRight size={17} />
              </Button>
            </div>
           <img className="software-hero" src={software} alt="BUY and SELL Software" width={600} height={400} />
          </div>
          <RiskNote />
          <SectionHeading eyebrow="BUILT FOR A STRUCTURED WORKFLOW" title="Software features." />
          <div className="software-feature-grid">
            {softwareFeatures.map((f, i) => (
              <Feature key={f.title} icon={[Cpu, TrendingUp, ShieldCheck][i % 3] ?? Cpu} title={f.title}>
                {f.description}
              </Feature>
            ))}
          </div>
          <p className="small-note">
            Feature descriptions are supplied marketing information and remain subject to
            verification and business review.
          </p>
        </div>
      </section>
      <section className="section section-muted">
        <div className="container">
          <SectionHeading
            eyebrow="WHY CHOOSE OUR SOFTWARE?"
            title="More clarity. Less complexity."
          />
          <div className="feature-grid">
            {[
              ["Save Time", "Get insights instantly."],
              ["Make Better Plans", "Use data-backed strategies."],
              ["Grow Faster", "Spot opportunities early."],
              ["Stay Ahead", "Be informed and competitive."],
            ].map(([t, d]) => (
              <Feature key={t} title={t ?? ''}>
                {d}
              </Feature>
            ))}
          </div>
          <SectionHeading eyebrow="MARKETS SUPPORTED" title="Your markets, connected." />
          <div className="feature-grid">
            {[
              { t: "GOLD", d: "Futures & Options", icon: Gem },
              { t: "FOREX", d: "Major Currency Pairs", icon: Globe2 },
              { t: "CRYPTO", d: "Top Cryptocurrencies", icon: Bitcoin },
              {
                t: "ALL MARKETS",
                d: "Equity | Futures | Options | Indices & More",
                icon: ChartNoAxesCombined,
              },
            ].map((m) => (
              <Feature key={m.t} title={m.t} icon={m.icon}>
                {m.d}
              </Feature>
            ))}
          </div>
          <ShortTermBreakout
        apiBaseUrl={import.meta.env.VITE_API_BASE_URL ?? ""}
      />

          <div className="benefits-strip">
            <h3>Software benefits</h3>
            <span>Real-Time Performance</span>
            <span>Risk Management</span>
            <span>24/7 Support*</span>
            <span>Secure & Trusted*</span>
          </div>
          <p className="small-note">
            *Support availability and security claims require business substantiation. “Maximum
            Profits” is supplied marketing copy under review, not a factual outcome or a guarantee.
          </p>
        </div>
      </section>
      <section id="trial" className="trial-band">
        <div className="container">
          <div>
            <span className="eyebrow">EXPLORE BEFORE YOU COMMIT</span>
            <h2>
              Try BUY and SELL Software
              <br />
              Free for 3 Days.
            </h2>
            <p>A hands-on introduction, subject to trial request approval.</p>
          </div>
          <Button size="lg" className="action" onClick={() => setTrialOpen(true)}>
            Request Free Trial
            <ArrowRight size={17} />
          </Button>
        </div>
      </section>
      <section id="trillion-contact" className="section">
        <div className="container">
          <SectionHeading eyebrow="WE’RE HERE TO HELP" title="Talk to Trillion Trading." />
          <ContactLinks />
        </div>
      </section>
      <ContactBand />
      <Dialog
        open={Boolean(product)}
        onOpenChange={(open) => {
          if (!open) setProduct(null);
        }}
      >
        <DialogContent className="form-dialog">
          <DialogTitle className="sr-only">Course and Software Checkout</DialogTitle>
         {product && (
  <Checkout
    product={product}
    business="TRILLION_TRADING"
    onClose={() => setProduct(null)}
  />
)}
        </DialogContent>
      </Dialog>
      <Dialog open={trialOpen} onOpenChange={setTrialOpen}>
        <DialogContent className="form-dialog">
          <DialogTitle>Request your 3-day free trial</DialogTitle>
          <p>Tell us about your preferred market. Access starts only after approval.</p>
          <form onSubmit={trial}>
            <Field label="Full Name" name="name" />
            <div className="form-grid">
              <Field label="Mobile Number" name="mobile" type="tel" />
              <Field label="Email Address" name="email" type="email" />
            </div>
            <Field label="Preferred Market" name="market">
              <select name="market" required>
                <option value="">Select a market</option>
                <option>Gold</option>
                <option>Forex</option>
                <option>Crypto</option>
                <option>Equity</option>
                <option>Futures & Options</option>
              </select>
            </Field>
            <Field label="Additional Message" name="message" required={false}>
              <textarea name="message" rows={3} />
            </Field>
            <FormMessage message={message} success={success} />
            <SubmitButton busy={busy}>Submit Trial Request</SubmitButton>
            <BackendNotice />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
