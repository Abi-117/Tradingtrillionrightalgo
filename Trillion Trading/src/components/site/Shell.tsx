import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ArrowUpRight, Instagram, MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo, External, RiskNote } from "./shared";
import { site } from "@/config/site";
const nav = [
  { to: "/" as const, label: "Home" },
  { to: "/trillion-trading" as const, label: "Trillion Trading" },
  { to: "/right-algo-trading" as const, label: "Right Algo Trading" },
  { to: "/daily-report" as const, label: "Daily Report" },
  { to: "/contact" as const, label: "Contact" },
];
export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Link to="/" className="brand-lockup" onClick={() => setOpen(false)}>
          <Logo />
          <div className="dual-brand">
            <strong>Trillion Trading</strong>
            <strong>
              <span>&amp;</span> Right Algo Trading
            </strong>
          </div>
        </Link>
        <nav aria-label="Main navigation" className={open ? "main-nav is-open" : "main-nav"}>
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "active" }}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
  <Button asChild variant="outline">
    <Link to="/rm/login" search={{ mode: "login" }}>
      Login
    </Link>
  </Button>

  <Button asChild className="nav-cta">
    <Link to="/student-login" search={{ mode: "login" }}>
      Student Login
      <ArrowUpRight size={16} />
    </Link>
  </Button>
</div>
        <Button
          variant="ghost"
          size="icon"
          className="mobile-menu"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="brand-lockup">
              <Logo />
              <div>
                <strong>
                  Trillion Trading
&
Right Algo Trading
                </strong>
              </div>
            </Link>
            <p>
              Trading education, technology, and algorithmic trading solutions.
              <br />A more informed way forward.
            </p>
            <div className="footer-social">
              <External href={site.trillion.instagram}>
                <Instagram size={17} />
                <span className="sr-only">Trillion Instagram</span>
              </External>
              <External href={site.trillion.whatsapp}>
                <MessageCircle size={17} />
                <span className="sr-only">Trillion WhatsApp</span>
              </External>
              <External href={site.rightInstagram}>
                 <Instagram size={17} />
                <span className="sr-only">Right Algo Instagram</span>
              </External>
              <External href={site.right.whatsapp}>
                <MessageCircle size={17} />
                <span className="sr-only">Right Algo WhatsApp</span>
              </External>
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            {nav.map((n) => (
              <Link key={n.to} to={n.to}>
                {n.label}
              </Link>
            ))}
          </div>
          <div>
            <h4>Trillion Trading</h4>
            <Link to="/trillion-trading" hash="course">
              Trading Course
            </Link>
            <Link to="/trillion-trading" hash="software">
              BUY and SELL Software
            </Link>
            <Link to="/trillion-trading" hash="trial">
              Free Trial
            </Link>
            <External href={site.trillion.whatsapp}>WhatsApp Enquiry</External>
          </div>
          <div>
            <h4>Right Algo Trading</h4>
            <Link to="/right-algo-trading">Registration</Link>
            <Link to="/right-algo-trading" search={{ mode: "login" }}>
              Member Login
            </Link>
            <External href={site.rightInstagram}>Instagram</External>
            <Link to="/contact">Support</Link>
          </div>
          <div>
            <h4>Get in touch</h4>
            <a href={`tel:+91${site.trillion.phone}`}>
              <Phone size={14} />
              {site.trillion.phone}
            </a>
             <a href={`tel:+91${site.right.phone}`}>
              <Phone size={14} />
              {site.right.phone}
            </a>
            <a href={`mailto:${site.trillion.email}`}>
              <Mail size={14} />
              {site.trillion.email}
            </a>
            
<div className="flex flex-row items-center gap-4 flex-nowrap">
  <Logo brand="trillion" className="footer-business-logo" />
  <Logo brand="right" className="footer-business-logo" />
</div>

          </div>
        </div>
        <RiskNote />
        <div className="footer-legal">
          <span>© {new Date().getUTCFullYear()} Trillion Trading & Right Algo Trading.</span>
          <div>
            <Link to="/policies/$policy" params={{ policy: "privacy" }}>
              Privacy Policy
            </Link>
            <Link to="/policies/$policy" params={{ policy: "terms" }}>
              Terms & Conditions
            </Link>
            <Link to="/policies/$policy" params={{ policy: "refund" }}>
              Refund & Cancellation
            </Link>
            <Link to="/policies/$policy" params={{ policy: "payment" }}>
              Payment & Coupon Terms
            </Link>
            <Link to="/policies/$policy" params={{ policy: "risk" }}>
              Risk Disclosure
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
