import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { PageIntro, ContactLinks, RiskNote, External } from "@/components/site/shared";
import { site, pageHead } from "@/config/site";
import { useState } from "react";
export const Route = createFileRoute("/member")({
  head: () =>
    pageHead(
      "Right Algo Member Area",
      "The protected Right Algo Trading member area requires a verified registration payment and an authorized member session.",
    ),
  component: MemberPage,
});
function MemberPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const q = useQuery({
    queryKey: ["member"],
    queryFn: async () => {
      const [member, membership] = await Promise.all([authService.me(), authService.membership()]);
      return { member, membership };
    },
    retry: false,
    enabled: Boolean(site.apiBaseUrl),
  });
  const authorized =
    q.data?.membership.active &&
    q.data.membership.paymentVerified &&
    q.data.membership.registrationVerified;
  return (
    <>
      <PageIntro
        brand="right"
        eyebrow="RIGHT ALGO TRADING"
        title="Member area."
        text="Your verified membership, profile, and trading software information."
      />
      <section className="section">
        <div className="container">
          {q.isLoading ? (
            <div className="empty-state">
              <h2>Checking membership…</h2>
            </div>
          ) : !authorized ? (
            <div className="empty-state">
              <h2>Member sign-in required.</h2>
              <p>Access requires an authorized session and a verified registration payment.</p>
              <Button asChild>
                <Link to="/right-algo-trading" search={{ mode: "login" }}>
                  Sign In
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="section-heading">
                <h2>Welcome, {q.data?.member.name}</h2>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await authService.logout();
                      await navigate({ to: "/right-algo-trading", search: { mode: "login" } });
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Sign-out failed.");
                    }
                  }}
                >
                  Sign Out
                </Button>
              </div>
              {error && <p role="alert">{error}</p>}
              <div className="member-grid">
                <article>
                  <h3>Member profile</h3>
                  <p>{q.data?.member.name}</p>
                  <p>{q.data?.member.email}</p>
                  <p>{q.data?.member.mobile}</p>
                </article>
                <article>
                  <h3>Membership status</h3>
                  <p>{q.data?.membership.status}</p>
                  <h4>Registration payment</h4>
                  <p>{q.data?.membership.paymentStatus}</p>
                </article>
                <article>
                  <h3>Software information</h3>
                  <p>NIFTY (NFO) · Algorithmic trading workflows</p>
                  <p>SENSEX (BFO) · Automated execution, where supported</p>
                  <p>Risk management and market monitoring</p>
                </article>
              </div>
              <Button asChild>
                <External href={site.rightGroup}>Join Member WhatsApp Group</External>
              </Button>
              <ContactLinks right />
              <RiskNote />
            </>
          )}
        </div>
      </section>
    </>
  );
}
