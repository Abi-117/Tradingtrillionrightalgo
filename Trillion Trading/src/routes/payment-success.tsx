import { createFileRoute } from "@tanstack/react-router";
import { PaymentStatus, paymentSearch } from "@/components/site/PaymentStatus";
import { pageHead } from "@/config/site";
export const Route = createFileRoute("/payment-success")({
  validateSearch: paymentSearch,
  head: () =>
    pageHead(
      "Payment Verification",
      "Check your securely verified Trillion Trading or Right Algo Trading purchase and receipt.",
    ),
  component: Page,
});
function Page() {
  return <PaymentStatus {...Route.useSearch()} />;
}
