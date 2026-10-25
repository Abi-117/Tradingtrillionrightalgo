import { Router } from "express";
import crypto from "crypto";

import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";

const router = Router();

function safeEqualHex(a, b) {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    !/^[a-f0-9]+$/i.test(a) ||
    !/^[a-f0-9]+$/i.test(b)
  ) {
    return false;
  }

  const first = Buffer.from(a, "hex");
  const second = Buffer.from(b, "hex");

  return (
    first.length > 0 &&
    first.length === second.length &&
    crypto.timingSafeEqual(first, second)
  );
}

router.post("/", async (req, res, next) => {
  try {
    const secret = process.env.TRILLION_RAZORPAY_WEBHOOK_SECRET;
    const signature = req.get("x-razorpay-signature");

    if (!secret || !req.rawBody || !signature) {
      return res.status(400).json({
        success: false,
        message: "Webhook verification data is missing.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    if (!safeEqualHex(expectedSignature, signature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    const event = req.body?.event;

    // Process only captured payments in this handler.
    if (event !== "payment.captured") {
      return res.status(200).json({
        success: true,
        message: "Webhook received; no action required.",
      });
    }

    const payment = req.body?.payload?.payment?.entity;

    if (
      !payment?.order_id ||
      !payment?.id ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid captured-payment payload.",
      });
    }

    const order = await Order.findOne({
      business: "TRILLION_TRADING",
      razorpayOrderId: payment.order_id,
    });

    if (!order) {
      // Return a failure so Razorpay can retry delivery.
      return res.status(500).json({
        success: false,
        message: "Matching order not found.",
      });
    }

    if (
      payment.amount !== order.amountPaise ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or currency mismatch.",
      });
    }

    // Atomic update makes repeated webhook deliveries safe.
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        business: "TRILLION_TRADING",
        paymentStatus: { $ne: "PAID" },
      },
      {
        $set: {
          paymentStatus: "PAID",
          razorpayPaymentId: payment.id,
          verifiedAt: new Date(),
          receiptNumber:
            `TRI-${String(order._id).slice(-12).toUpperCase()}`,
        },
      },
      { new: true }
    );

    // Only the request that transitions the order to PAID
    // increments the coupon's usage count.
    if (updatedOrder && order.couponCode) {
      await Coupon.updateOne(
        {
          business: "TRILLION_TRADING",
          code: order.couponCode,
        },
        { $inc: { usedCount: 1 } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;