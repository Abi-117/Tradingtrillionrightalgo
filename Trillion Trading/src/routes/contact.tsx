
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, Logo, ContactLinks } from "@/components/site/shared";
import { Field, FormMessage } from "@/components/site/Forms";
import { site, pageHead } from "@/config/site";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead(
      "Contact & Support",
      "Contact Trillion Trading for course and software enquiries, or get in touch with Right Algo Trading for registration and support.",
    ),
  component: Contact,
});

type BusinessOption = "TRILLION_TRADING" | "RIGHT_ALGO_TRADING";

function getWhatsAppNumber(link: string): string {
  // Supports either a WhatsApp URL or a number stored in config.
  if (/^\+?\d+$/.test(link.trim())) {
    return link.replace(/\D/g, "");
  }

  try {
    const url = new URL(link);
    const phone = url.searchParams.get("phone");

    if (phone) return phone.replace(/\D/g, "");

    const match = url.pathname.match(/\/(\d{8,15})\/?$/);
    if (match) return match[1];
  } catch {
    // Invalid URL: return an empty number below.
  }

  return "";
}

function Contact() {
  const [business, setBusiness] = useState<BusinessOption | "">("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccess(false);
    setMessage("");

    const form = new FormData(e.currentTarget);

    const name = String(form.get("name") ?? "").trim();
    const mobile = String(form.get("mobile") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const enquiry = String(form.get("enquiry") ?? "").trim();
    const enquiryMessage = String(form.get("message") ?? "").trim();

    if (!business) {
      setMessage("Please select a business.");
      return;
    }

    const whatsappLink =
      business === "TRILLION_TRADING"
        ? site.trillion.whatsapp
        : site.right.whatsapp;

    const phone = getWhatsAppNumber(whatsappLink);

    if (!phone) {
      setMessage(
        "The WhatsApp number is not configured correctly. Please check the WhatsApp link in your site configuration.",
      );
      return;
    }

    const businessName =
      business === "TRILLION_TRADING"
        ? "Trillion Trading"
        : "Right Algo Trading";

    const whatsappMessage = [
      "Hello " + businessName + ",",
      "",
      "I would like to make an enquiry.",
      "",
      "Name: " + name,
      "Mobile: " + mobile,
      "Email: " + email,
      "Business: " + businessName,
      "Enquiry: " + enquiry,
      "Message: " + enquiryMessage,
    ].join("\n");

    const url =
      "https://wa.me/" +
      phone +
      "?text=" +
      encodeURIComponent(whatsappMessage);

    window.open(url, "_blank", "noopener,noreferrer");
    setSuccess(true);
    setMessage("WhatsApp opened. Please send your enquiry message there.");
  }

  return (
    <>
      <PageIntro
        eyebrow="LET’S TALK TRADING"
        title="Get in touch."
        text="Choose your business and send your enquiry directly through WhatsApp."
      />

      <section className="section">
        <div className="container contact-layout">
          <div>
            <div className="contact-business">
              <Logo brand="trillion" />
              <h2>Trillion Trading</h2>
              <p>Trading courses, BUY and SELL Software, and free trials.</p>
              <ContactLinks />
              <Button
                asChild
                className="action"
              >
                <a
                  href={`https://wa.me/${getWhatsAppNumber(site.trillion.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={17} />
                  WhatsApp Trillion Trading
                </a>
              </Button>
            </div>

            <div className="contact-business">
              <Logo brand="right" />
              <h2>Right Algo Trading</h2>
              <p>Algorithmic trading, registration, and member enquiries.</p>
              <ContactLinks right />
              <Button asChild className="action">
                <a
                  href={`https://wa.me/${getWhatsAppNumber(site.right.whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={17} />
                  WhatsApp Right Algo
                </a>
              </Button>
              <p className="small-note">
                Member group access is available only to eligible paid members.
              </p>
            </div>
          </div>

          <div className="enquiry-form">
            <div className="eyebrow">SEND AN ENQUIRY</div>
            <h2>How can we help?</h2>
            <p>
              Fill in your details and we’ll open WhatsApp for your selected
              business.
            </p>

            <form onSubmit={submit}>
              <Field label="Full Name" name="name" />

              <div className="form-grid">
                <Field label="Mobile Number" name="mobile" type="tel" />
                <Field label="Email Address" name="email" type="email" />
              </div>

              <div className="form-grid">
                <Field label="Select Business" name="business">
                  <select
                    name="business"
                    required
                    value={business}
                    onChange={(e) => {
                      setBusiness(e.target.value as BusinessOption | "");
                      setMessage("");
                      setSuccess(false);
                    }}
                  >
                    <option value="">Select business</option>
                    <option value="TRILLION_TRADING">
                      Trillion Trading
                    </option>
                    <option value="RIGHT_ALGO_TRADING">
                      Right Algo Trading
                    </option>
                  </select>
                </Field>

                <Field label="Select Enquiry" name="enquiry">
                  <select name="enquiry" required defaultValue="">
                    <option value="" disabled>
                      Select enquiry
                    </option>
                    {[
                      "Course",
                      "Software",
                      "Free Trial",
                      "Registration",
                      "Payment",
                      "General Enquiry",
                    ].map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Message" name="message">
                <textarea
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us a little about your enquiry…"
                />
              </Field>

              <FormMessage message={message} success={success} />

              <Button type="submit" size="lg" className="action form-submit">
                <MessageCircle size={17} />
                Continue to WhatsApp
              </Button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
