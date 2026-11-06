
import { Router } from "express";
import crypto from "crypto";

import AutoPaySubscription from "../models/AutoPaySubscription.js";
import AutoPayPayment from "../models/AutoPayPayment.js";
import { requireStudent } from "../middleware/requireStudent.js";

const router = Router();

function safeEqualHex(a, b) {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    !/^[a-f0-9]{64}$/i.test(a) ||
    !/^[a-f0-9]{64}$/i.test(b)
  ) {
    return false;
  }

  const first = Buffer.from(a, "hex");
  const second = Buffer.from(b, "hex");

  return (
    first.length === second.length &&
    crypto.timingSafeEqual(first, second)
  );
}

router.post("/webhook/:business", async (req, res) => {
  try {
    const business = req.params.business;

    if (
      ![
        "TRILLION_TRADING",
        "RIGHT_ALGO_TRADING",
      ].includes(business)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook business.",
      });
    }

    const secret =
      business === "TRILLION_TRADING"
        ? process.env.TRILLION_RAZORPAY_AUTOPAY_WEBHOOK_SECRET
        : process.env.RIGHT_ALGO_RAZORPAY_AUTOPAY_WEBHOOK_SECRET;

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

    const subscription =
      req.body?.payload?.subscription?.entity;

    if (!subscription?.id) {
      return res.status(200).json({
        success: true,
        message: "No subscription information to process.",
      });
    }

    const record = await AutoPaySubscription.findOne({
      business,
      razorpaySubscriptionId: subscription.id,
    });

    if (!record) {
      return res.status(500).json({
        success: false,
        message: "Matching AutoPay subscription not found.",
      });
    }

    const nextBillingAt =
      Number.isSafeInteger(subscription.charge_at) &&
      subscription.charge_at > 0
        ? new Date(subscription.charge_at * 1000)
        : null;

    switch (event) {
      case "subscription.activated": {
        record.status = "ACTIVE";
        record.activatedAt =
          record.activatedAt || new Date();

        if (nextBillingAt) {
          record.nextBillingAt = nextBillingAt;
        }

        break;
      }

      case "subscription.charged": {
        const payment =
          req.body?.payload?.payment?.entity;

        if (
          !payment?.id ||
          payment.status !== "captured" ||
          payment.subscription_id !== subscription.id
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid subscription payment details.",
          });
        }

        if (
          payment.amount !== record.amountPaise ||
          payment.currency !== "INR"
        ) {
          return res.status(400).json({
            success: false,
            message: "Subscription payment amount mismatch.",
          });
        }

        // Prevent duplicate processing of the same payment.
       const paidAt = payment.created_at
  ? new Date(payment.created_at * 1000)
  : new Date();

// Save each Razorpay payment only once.
await AutoPayPayment.updateOne(
  { razorpayPaymentId: payment.id },
  {
    $setOnInsert: {
      business,
      autoPaySubscription: record._id,
      razorpaySubscriptionId: subscription.id,
      razorpayPaymentId: payment.id,
      amountPaise: payment.amount,
      currency: payment.currency,
      status: "CAPTURED",
      paidAt,
    },
  },
  { upsert: true }
);

// Update subscription only when this is a newer payment.
if (
  !record.lastPaidAt ||
  paidAt > record.lastPaidAt
) {
  record.lastPaymentId = payment.id;
  record.lastPaidAt = paidAt;
  record.status = "ACTIVE";

  if (nextBillingAt) {
    record.nextBillingAt = nextBillingAt;
  }
}

        break;
      }

      case "subscription.halted": {
        record.status = "HALTED";
        break;
      }

      case "subscription.cancelled": {
        record.status = "CANCELLED";
        record.cancelledAt = new Date();
        break;
      }

      case "subscription.completed": {
        record.status = "COMPLETED";
        break;
      }

      case "subscription.paused": {
        record.status = "HALTED";
        break;
      }

      case "subscription.resumed": {
        record.status = "ACTIVE";
        break;
      }

      default:
        return res.status(200).json({
          success: true,
          message: "Webhook received; no action required.",
        });
    }

    await record.save();

    return res.status(200).json({
      success: true,
      message: "AutoPay webhook processed.",
    });
  } catch (error) {
    console.error("AutoPay webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "AutoPay webhook processing failed.",
    });
  }
});

router.get("/my-payments", requireStudent, async (req, res) => {
  try {
    const subscriptions = await AutoPaySubscription.find({
      studentId: req.student._id,
      ...(req.query.business
        ? { business: req.query.business }
        : {}),
    }).select("_id");

    const subscriptionIds = subscriptions.map(
      (subscription) => subscription._id
    );

    const payments = await AutoPayPayment.find({
      autoPaySubscription: { $in: subscriptionIds },
    })
      .sort({ paidAt: -1 })
      .select(
        "business razorpaySubscriptionId razorpayPaymentId amountPaise currency status paidAt createdAt"
      )
      .lean();

    return res.status(200).json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("AutoPay payment history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment history.",
    });
  }
});

export default router;
