
import trillionRazorpay from "./trillionRazorpay.js";
import { getRightAlgoRazorpay } from "./rightAlgoRazorpay.js";

export function getAutoPayRazorpay(business) {
  if (business === "TRILLION_TRADING") {
    return trillionRazorpay;
  }

  if (business === "RIGHT_ALGO_TRADING") {
    return getRightAlgoRazorpay();
  }

  throw new Error("Invalid AutoPay business.");
}

// Create a monthly plan using the actual discounted amount.
export async function createMonthlyPlan({
  business,
  product,
  amountPaise,
}) {
  if (
    !Number.isSafeInteger(amountPaise) ||
    amountPaise < 100
  ) {
    throw new Error("Invalid AutoPay subscription amount.");
  }

  const razorpay = getAutoPayRazorpay(business);

  return razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: `${business} - ${product} Monthly AutoPay`,
      amount: amountPaise,
      currency: "INR",
      description: "Monthly recurring payment",
    },
    notes: {
      business,
      product,
      paymentType: "AUTOPAY",
    },
  });
}

// Create a subscription against the monthly plan.

export async function createMonthlySubscription({
  business,
  planId,
  startAt,
  notes,
}) {
  if (!planId) {
    throw new Error("Razorpay Plan ID is required.");
  }

  if (
    !Number.isSafeInteger(startAt) ||
    startAt <= Math.floor(Date.now() / 1000)
  ) {
    throw new Error("AutoPay start date must be in the future.");
  }

  const razorpay = getAutoPayRazorpay(business);

  return razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 120,
    quantity: 1,
    customer_notify: true,
    start_at: startAt,
    notes: {
      ...notes,
      business,
      paymentType: "AUTOPAY",
    },
  });
}


// Fetch subscription status from Razorpay.
export async function fetchAutoPaySubscription({
  business,
  subscriptionId,
}) {
  if (!subscriptionId) {
    throw new Error("Subscription ID is required.");
  }

  const razorpay = getAutoPayRazorpay(business);

  return razorpay.subscriptions.fetch(subscriptionId);
}

// Cancel a subscription.
export async function cancelAutoPaySubscription({
  business,
  subscriptionId,
  cancelAtCycleEnd = true,
}) {
  if (!subscriptionId) {
    throw new Error("Subscription ID is required.");
  }

  const razorpay = getAutoPayRazorpay(business);

  return razorpay.subscriptions.cancel(
    subscriptionId,
    cancelAtCycleEnd
  );
}
