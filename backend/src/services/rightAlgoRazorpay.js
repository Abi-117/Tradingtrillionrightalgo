import Razorpay from "razorpay";

let client;

export function getRightAlgoRazorpay() {
  const key_id = process.env.RIGHT_ALGO_RAZORPAY_KEY_ID;
  const key_secret = process.env.RIGHT_ALGO_RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "RIGHT_ALGO_RAZORPAY_KEY_ID and RIGHT_ALGO_RAZORPAY_KEY_SECRET must be set in backend/.env",
    );
  }

  if (!client) client = new Razorpay({ key_id, key_secret });
  return client;
}
