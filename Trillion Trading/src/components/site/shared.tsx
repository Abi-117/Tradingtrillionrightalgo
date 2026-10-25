import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Check,
  MessageCircle,
  Mail,
  Phone,
  Instagram,
  ChevronDown,
  Cpu,
  BarChart3,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import mainLogo from "@/assets/main.png";
import trillionLogo from "@/assets/trillion.png";
import rightLogo from "@/assets/right.png";
import { site } from "@/config/site";
export const logos = { main: mainLogo, trillion: trillionLogo, right: rightLogo };
export function Logo({
  brand = "main",
  className = "",
}: {
  brand?: keyof typeof logos;
  className?: string;
}) {
  return (
    <img
      src={logos[brand]}
      alt={
        brand === "right"
          ? "Right Algo Trading"
          : brand === "trillion"
            ? "Trillion Trading"
            : "Trillion Trading brand logo"
      }
      className={`brand-logo ${brand} ${className}`}
      width={72}
      height={72}
    />
  );
}
export function External({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
export function ActionLink({
  to,
  children,
  secondary = false,
}: {
  to: "/" | "/trillion-trading" | "/right-algo-trading" | "/daily-report" | "/contact";
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Button asChild size="lg" variant={secondary ? "outline" : "default"} className="action">
      <Link to={to}>
        {children}
        <ArrowUpRight size={17} />
      </Link>
    </Button>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {children}
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  text,
  brand,
}: {
  eyebrow: string;
  title: string;
  text: string;
  brand?: "trillion" | "right";
}) {
  return (
    <section className="page-intro">
      <div className="container">
        {brand && <Logo brand={brand} />}
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}
export function BackendNotice() {
  return !site.apiBaseUrl ? (
    <div className="connection-note">
      <ShieldCheck size={16} />
      <span>
        Payments and member services are not connected yet. No transaction or account will be
        created.
      </span>
    </div>
  ) : null;
}
export function RiskNote() {
  return (
    <p className="risk-note">
      <ShieldCheck size={15} />
      Trading involves market risk. Education and technology do not guarantee profits. Past
      performance does not indicate future results.
    </p>
  );
}
export function Feature({
  icon: Icon = Check,
  title,
  children,
}: {
  icon?: typeof Check;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="feature-item">
      <span className="icon-tile">
        <Icon size={21} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function BusinessCards() {
  return (
    <div className="business-grid">
      <article className="business-card">
        <div className="business-top">
          <Logo brand="trillion" />
          <span className="tag">
            <GraduationCap size={14} />
            EDUCATION & SOFTWARE
          </span>
        </div>
        <h3>Trillion Trading</h3>
        <p>Build your trading foundation. Develop your edge.</p>
        <p className="business-description">
          Learn technical analysis, price action, multi-timeframe analysis, risk management, and
          structured trading concepts through our two-level trading course. Explore our BUY and SELL
          trading software for market analysis and trading automation.
        </p>
        <div className="business-points">
          <span>
            <Check />
            30-day structured course
          </span>
          <span>
            <Check />
            BUY and SELL Software
          </span>
          <span>
            <Check />
            3-day software free trial
          </span>
        </div>
        <Link className="text-link" to="/trillion-trading">
          Explore Trillion Trading
          <ArrowUpRight size={19} />
        </Link>
      </article>
      <article className="business-card">
        <div className="business-top">
          <Logo brand="right" />
          <span className="tag gold">
            <Cpu size={14} />
            ALGORITHMIC TRADING
          </span>
        </div>
        <h3>Right Algo Trading</h3>
        <p>Smart technology. A more structured approach.</p>
        <p className="business-description">
          Explore algorithmic trading solutions designed for NIFTY and SENSEX derivatives, including
          NFO and BFO trading. Register through our paid registration process to access the member
          area and further information.
        </p>
        <div className="business-points">
          <span>
            <Check />
            NIFTY & SENSEX derivatives
          </span>
          <span>
            <Check />
            Automated trading workflows
          </span>
          <span>
            <Check />
            Member support & onboarding
          </span>
        </div>
        <Link className="text-link" to="/right-algo-trading">
          Explore Right Algo Trading
          <ArrowUpRight size={19} />
        </Link>
      </article>
    </div>
  );
}
export function FAQ() {
  const faqs = [
    [
      "Do I need trading experience to join?",
      "Level 1 begins with trading foundations, including candlestick patterns, indicators, and risk management. Level 2 covers advanced analysis and trade management.",
    ],
    [
      "What is included in the 30-day course?",
      "The course includes 30 sessions across two levels: Basic Trading Foundations and Advanced Trading Analysis. The advertised full course fee is ₹35,000.",
    ],
    [
      "Can I try BUY and SELL Software first?",
      "Yes. A 3-day free trial is available on request. Access is granted only after your request is reviewed and approved.",
    ],
    [
      "How do I become a Right Algo Trading member?",
      "Complete registration, pay the ₹2,000 registration fee, and wait for payment verification. Member access requires an authorized account.",
    ],
    [
      "Are trading returns or accuracy guaranteed?",
      "No. Trading involves risk, and actual results vary with market conditions, strategy, and execution. Neither profits nor accuracy are guaranteed.",
    ],
  ];
  return (
    <div className="faq-list">
      {faqs.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <ChevronDown size={18} />
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
export function ContactBand() {
  return (
    <section className="contact-band">
      <div className="container">
        <div>
          <div className="eyebrow">LET’S TALK TRADING</div>
          <h2>
            Your next step starts
            <br />
            with a conversation.
          </h2>
          <p>
            Questions about a course, software, or getting started?
            <br />
            We’re here to help you find the right path.
          </p>
        </div>
        <div className="contact-band-actions">
          <Button asChild size="lg" className="action">
            <External href={site.trillion.whatsapp}>
              <MessageCircle size={18} />
              WhatsApp Enquiry
              <ArrowUpRight size={17} />
            </External>
          </Button>
          <Button asChild variant="outline" size="lg" className="action">
            <Link to="/contact">
              Contact Us
              <ArrowRight size={17} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
export function ContactLinks({ right = false }: { right?: boolean }) {
  return right ? (
    <div className="contact-links">
      <External href={site.rightInstagram}>
        <Instagram size={18} />
        Follow on Instagram
        <ArrowUpRight size={15} />
      </External>
      {site.right.supportPhone ? (
        <>
          <a href={`tel:${site.right.supportPhone}`}>
            <Phone size={18} />
            Contact Support
          </a>
          <External href={`https://wa.me/${site.right.supportPhone}`}>
            <MessageCircle size={18} />
            WhatsApp Support
          </External>
        </>
      ) : (
        <Link to="/contact">
          <MessageCircle size={18} />
          Contact Support
        </Link>
      )}
      {site.right.supportEmail && (
        <a href={`mailto:${site.right.supportEmail}`}>
          <Mail size={18} />
          {site.right.supportEmail}
        </a>
      )}
    </div>
  ) : (
    <div className="contact-links">
      <a href={`tel:+91${site.trillion.phone}`}>
        <Phone size={18} />
        {site.trillion.phone}
      </a>
      <a href={`mailto:${site.trillion.email}`}>
        <Mail size={18} />
        {site.trillion.email}
      </a>
      <External href={site.trillion.whatsapp}>
        <MessageCircle size={18} />
        WhatsApp Enquiry
        <ArrowUpRight size={15} />
      </External>
      <External href={site.trillion.instagram}>
        <Instagram size={18} />
        Trading Instagram
        <ArrowUpRight size={15} />
      </External>
      <External href={site.trillion.softwareInstagram}>
        <Instagram size={18} />
        Software Instagram
        <ArrowUpRight size={15} />
      </External>
    </div>
  );
}
export function LearningHighlights() {
  return (
    <div className="feature-grid">
      <Feature icon={BarChart3} title="Read the market">
        Candlesticks, chart patterns, and technical analysis.
      </Feature>
      <Feature icon={Target} title="Build your strategy">
        Price action and multi-timeframe market analysis.
      </Feature>
      <Feature icon={ShieldCheck} title="Manage your risk">
        Position sizing, stop-losses, and trade management.
      </Feature>
      <Feature icon={Cpu} title="Explore technology">
        Smart tools and structured algorithmic workflows.
      </Feature>
    </div>
  );
}
