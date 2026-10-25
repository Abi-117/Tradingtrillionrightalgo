import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, RiskNote } from "@/components/site/shared";
import { pageHead } from "@/config/site";
const policies: Record<string, { title: string; sections: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      "Information collection and purposes",
      "Data retention, sharing, and security",
      "Your privacy rights and contact information",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    sections: [
      "Course, software, and membership eligibility",
      "Acceptable use and service limitations",
      "Business responsibilities and dispute resolution",
    ],
  },
  refund: {
    title: "Refund & Cancellation Policy",
    sections: [
      "Course enrolment cancellation",
      "Software purchase and trial cancellation",
      "Registration fee refund eligibility and processing timelines",
    ],
  },
  payment: {
    title: "Payment & Coupon Terms",
    sections: [
      "Separate payment accounts for each business",
      "Coupon eligibility, expiry, and non-stacking rules",
      "Verified payments, receipts, and duplicate payment assistance",
    ],
  },
  risk: {
    title: "Risk Disclosure",
    sections: [
      "Market and derivatives risk",
      "Algorithmic execution and technology risk",
      "No guaranteed returns or accuracy",
    ],
  },
};
export const Route = createFileRoute("/policies/$policy")({
  head: ({ params }) =>
    pageHead(
      policies[params.policy]?.title ?? "Policy Review",
      "Business policy draft for Trillion Trading and Right Algo Trading. Subject to business and legal review.",
    ),
  component: Policy,
});
function Policy() {
  const { policy } = Route.useParams();
  const p = policies[policy];
  return (
    <>
      <PageIntro
        eyebrow="BUSINESS POLICIES"
        title={p?.title ?? "Policy unavailable"}
        text="Draft placeholder — pending business and legal review."
      />
      <section className="section">
        <div className="container policy-content">
          <div className="connection-note">
            This page is not a legally approved policy. Final business-reviewed wording has not yet
            been supplied.
          </div>
          {p?.sections.map((t) => (
            <div key={t}>
              <h2>{t}</h2>
              <p>
                Draft placeholder: the business will provide and approve the applicable terms for
                this section before publication.
              </p>
            </div>
          ))}
          {policy === "risk" && (
            <>
              <RiskNote />
              <p>
                Trading in derivatives, foreign exchange, crypto, and other financial markets can
                lead to substantial losses. Automation does not remove market or execution risk. The
                advertised Right Algo accuracy range is unverified and not guaranteed.
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
