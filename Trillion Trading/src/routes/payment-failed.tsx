import { createFileRoute } from "@tanstack/react-router";
import { PaymentStatus, paymentSearch } from "@/components/site/PaymentStatus";
import { pageHead } from "@/config/site";
export const Route = createFileRoute("/payment-failed")({
  validateSearch: paymentSearch,
  head: () =>
    pageHead(
      "Payment Assistance",
      "Get assistance with a failed or unverified Trillion Trading or Right Algo Trading payment.",
    ),
  component: Page,
});
function Page() {
  return <PaymentStatus {...Route.useSearch()} failed />;
}
