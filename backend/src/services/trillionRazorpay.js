import Razorpay from "razorpay";

if (
  !process.env.TRILLION_RAZORPAY_KEY_ID ||
  !process.env.TRILLION_RAZORPAY_KEY_SECRET
) {
  throw new Error("Trillion Razorpay credentials are missing");
}

const trillionRazorpay = new Razorpay({
  key_id: process.env.TRILLION_RAZORPAY_KEY_ID,
  key_secret: process.env.TRILLION_RAZORPAY_KEY_SECRET,
});

export default trillionRazorpay;