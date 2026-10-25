import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import software from "@/assets/Buy.png";
import {
  ArrowUpRight,
  ArrowRight,
  GraduationCap,
  Cpu,
  ShieldCheck,
  Check,
  MoveUpRight,
  FileBarChart2,
  Clock3,
} from "lucide-react";

import hero from "@/assets/market.png";
import { Button } from "@/components/ui/button";
import {
  ActionLink,
  BusinessCards,
  ContactBand,
  FAQ,
  Feature,
  LearningHighlights,
  Logo,
  SectionHeading,
} from "@/components/site/shared";
import { ChartDemo } from "@/components/site/ChartDemo";
import { LatestReports } from "@/components/site/LatestReports";
import { pageHead } from "@/config/site";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Trading Education & Algorithmic Trading",
      "Discover structured trading courses, BUY and SELL Software, and NIFTY and SENSEX algorithmic trading with Trillion Trading and Right Algo Trading.",
    ),
  component: Home,
});

/* ---------- Animation settings ---------- */

const easeOut = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, y: 28 }
      }
      whileInView={
        shouldReduceMotion
          ? undefined
          : { opacity: 1, y: 0 }
      }
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.7,
        delay,
        ease: easeOut,
      }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      className={className}
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, y: 24 }
      }
      whileInView={
        shouldReduceMotion
          ? undefined
          : { opacity: 1, y: 0 }
      }
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.65, ease: easeOut }}
    >
      {children}
    </motion.section>
  );
}

/* ---------- Homepage ---------- */

function Home() {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <>
      {/* HERO SECTION */}
      <section className="home-hero">
        <motion.img
          className="hero-visual"
          src={hero}
          alt="Blue and silver rising candlestick bars representing structured market analysis"
          width={1920}
          height={1024}
          initial={
            shouldReduceMotion
              ? false
              : { opacity: 0, scale: 1.06 }
          }
          animate={
            shouldReduceMotion
              ? undefined
              : { opacity: 1, scale: 1 }
          }
          transition={{ duration: 1.2, ease: easeOut }}
        />

        <div className="container hero-content">
          <motion.div
            className="hero-eyebrow"
            {...fadeUp}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            <span />
            KNOWLEDGE MEETS TECHNOLOGY
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.75, delay: 0.22, ease: easeOut }}
          >
            Learn Trading.
            <br />
            Explore Technology.
            <br />
            <span>Trade Smarter.</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            Discover structured trading education, advanced market
            <br className="desktop-break" /> analysis, and algorithmic trading solutions with
            <br className="desktop-break" /> Trillion Trading and Right Algo Trading.
          </motion.p>

          <motion.div
            className="hero-actions"
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.45 }}
          >
            <ActionLink to="/trillion-trading">
              Explore Trillion Trading
            </ActionLink>

            <ActionLink to="/right-algo-trading" secondary>
              Explore Right Algo
            </ActionLink>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.55 }}
          >
            <Link to="/daily-report" className="hero-report-link">
              <FileBarChart2 size={16} />
              View Daily Reports
              <ArrowRight size={15} />
            </Link>
          </motion.div>

          <motion.div
            className="hero-brand-row"
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.65 }}
          >
            <Logo brand="trillion" />
            <span className="brand-divider" />
            <Logo brand="right" />
            <span>
              Two specialities.
              <br />
              <strong>One smarter approach.</strong>
            </span>
          </motion.div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <Reveal>
        <div className="trust-strip">
          <div className="container">
            <span>
              <GraduationCap />
              Structured Trading Education
            </span>
            <span>
              <Cpu />
              Technology-Driven Solutions
            </span>
            <span>
              <ShieldCheck />
              Risk-First Approach
            </span>
            <span>
              <Clock3 />
              Dedicated Member Support
            </span>
          </div>
        </div>
      </Reveal>

      {/* TWO BRANDS */}
      <AnimatedSection className="section">
        <div className="container">
          <Reveal>
            <SectionHeading
              eyebrow="TWO BRANDS. ONE VISION."
              title="Find your path in the markets."
              text="From your first candlestick to automated trading workflows — explore what’s right for you."
            />
          </Reveal>

          <Reveal delay={0.12}>
            <BusinessCards />
          </Reveal>
        </div>
      </AnimatedSection>

      {/* TRADING EDUCATION */}
      <AnimatedSection className="section section-muted">
        <div className="container">
          <Reveal>
            <SectionHeading
              eyebrow="KNOWLEDGE IS YOUR FIRST INVESTMENT"
              title="Strong foundations. Smarter decisions."
              text="Learn to understand the market before you enter it."
            />
          </Reveal>

          <Reveal delay={0.1}>
            <LearningHighlights />
          </Reveal>

          <Reveal delay={0.18}>
            <motion.div
              className="course-teaser"
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -5 }
              }
              transition={{ duration: 0.25 }}
            >
              <div>
                <span className="tag">TRILLION TRADING COURSE</span>
                <h3>Multi Timeframe Analysis</h3>
                <p>
                  From basic foundations to advanced price action — a clear,
                  structured learning journey.
                </p>

                <div className="inline-facts">
                  <span>
                    <Check size={15} />
                    2 Learning Levels
                  </span>
                  <span>
                    <Check size={15} />
                    30 Days
                  </span>
                  <span>
                    <Check size={15} />
                    30 Sessions
                  </span>
                </div>
              </div>

              <div>
                <strong>₹35,000</strong>
                <span>Full course package</span>
                <ActionLink to="/trillion-trading">
                  Explore the Course
                </ActionLink>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </AnimatedSection>

      {/* BUY AND SELL SOFTWARE */}
      <AnimatedSection className="section">
        <div className="container software-home">
          <Reveal>
            <div>
              <div className="eyebrow">
                YOUR STRATEGY. SUPPORTED BY TECHNOLOGY.
              </div>

              <h2>
                Meet BUY and SELL
                <br />
                Software.
              </h2>

              <p>
                Bring market analysis, smart signals, and risk controls into
                one straightforward trading experience.
              </p>

              <ul className="check-list">
                <li>
                  <Check />
                  Smart algorithms &amp; real-time analysis
                </li>
                <li>
                  <Check />
                  Automated execution, where supported
                </li>
                <li>
                  <Check />
                  Gold, Forex, Crypto &amp; Equity markets
                </li>
                <li>
                  <Check />
                  A simple, user-friendly interface
                </li>
              </ul>

              <div className="hero-actions">
                <ActionLink to="/trillion-trading">
                  Explore Software
                </ActionLink>

                <span className="trial-note">
                  3-day free trial available
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <motion.div
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -4, scale: 1.01 }
              }
              transition={{ duration: 0.3 }}
            >
              <img src={software} alt="BUY and SELL software interface" />
            </motion.div>
          </Reveal>
        </div>
      </AnimatedSection>

      {/* RIGHT ALGO TRADING */}
      <AnimatedSection className="section algo-home">
        <div className="container algo-home-inner">
          <Reveal>
            <Logo brand="right" />
          </Reveal>

          <Reveal delay={0.12}>
            <div>
              <div className="eyebrow">RIGHT ALGO TRADING</div>
              <h2>Precision meets automation.</h2>
              <p>
                Explore algorithmic trading workflows for NIFTY (NFO) and
                SENSEX (BFO), with risk controls and structured member
                onboarding.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <ActionLink to="/right-algo-trading">
              Explore Right Algo
            </ActionLink>
          </Reveal>
        </div>
      </AnimatedSection>

      {/* DAILY REPORTS */}
      <AnimatedSection className="section">
        <div className="container">
          <Reveal>
            <SectionHeading
              eyebrow="A CLOSER LOOK AT THE MARKETS"
              title="Daily market reports."
              text="Market updates and trading reports, all in one place."
            >
              <Button asChild variant="outline">
                <Link to="/daily-report">
                  View All Reports
                  <ArrowUpRight />
                </Link>
              </Button>
            </SectionHeading>
          </Reveal>

          <Reveal delay={0.12}>
            <LatestReports />
          </Reveal>
        </div>
      </AnimatedSection>

      {/* FEATURES */}
      <AnimatedSection className="section section-muted">
        <div className="container">
          <Reveal>
            <SectionHeading
              eyebrow="THE TRILLION APPROACH"
              title="Built around what matters."
            />
          </Reveal>

          <div className="feature-grid">
            <Reveal delay={0.05}>
              <Feature
                icon={GraduationCap}
                title="Structured, not scattered"
              >
                A step-by-step curriculum, from the foundations to advanced
                concepts.
              </Feature>
            </Reveal>

            <Reveal delay={0.12}>
              <Feature icon={ShieldCheck} title="Risk comes first">
                A responsible approach with no promises of guaranteed profits.
              </Feature>
            </Reveal>

            <Reveal delay={0.19}>
              <Feature icon={Cpu} title="Practical technology">
                Tools built around analysis, execution, and market awareness.
              </Feature>
            </Reveal>

            <Reveal delay={0.26}>
              <Feature
                icon={MoveUpRight}
                title="Support at every step"
              >
                Course enquiries, software onboarding, and member assistance.
              </Feature>
            </Reveal>
          </div>
        </div>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection className="section">
        <div className="container faq-section">
          <Reveal>
            <div>
              <div className="eyebrow">A LITTLE MORE CLARITY</div>
              <h2>
                Your questions,
                <br />
                answered.
              </h2>
              <p>
                Everything you need to take
                <br />
                your next step with confidence.
              </p>
              <Link to="/contact" className="text-link">
                Have another question?
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <FAQ />
          </Reveal>
        </div>
      </AnimatedSection>

      {/* CONTACT */}
      <Reveal>
        <ContactBand />
      </Reveal>
    </>
  );
}