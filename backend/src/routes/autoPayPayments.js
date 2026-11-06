
import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import Order from "../models/Order.js";
import AutoPaySubscription from "../models/AutoPaySubscription.js";
import { requireStudent } from "../middleware/requireStudent.js";
import crypto from "crypto";

import {
  createMonthlyPlan,
  createMonthlySubscription,
  fetchAutoPaySubscription,
  cancelAutoPaySubscription,
} from "../services/autoPayRazorpay.js";
import AutoPayPayment from "../models/AutoPayPayment.js";

const router = Router();

const createSubscriptionSchema = z.object({
  business: z.enum([
    "TRILLION_TRADING",
    "RIGHT_ALGO_TRADING",
  ]),
  product: z.enum([
    "SOFTWARE",
    "RIGHT_SOFTWARE",
    "LEVEL_1",
    "LEVEL_2",
    "COURSE_PACKAGE",
  ]),
  initialOrderId: z.string().min(1),
  consentAccepted: z.literal(true),
});

function isAllowedProduct(business, product) {
  if (business === "TRILLION_TRADING") {
    return [
      "SOFTWARE",
      "LEVEL_1",
      "LEVEL_2",
      "COURSE_PACKAGE",
    ].includes(product);
  }

  if (business === "RIGHT_ALGO_TRADING") {
    return product === "RIGHT_SOFTWARE";
  }

  return false;
}

function getNextMonthlyDate(paymentDate) {
  const nextDate = new Date(paymentDate);

  const originalDay = nextDate.getUTCDate();

  const nextMonth = nextDate.getUTCMonth() + 1;
  const nextYear =
    nextDate.getUTCFullYear() +
    Math.floor(nextMonth / 12);

  const normalizedMonth = nextMonth % 12;

  const lastDayOfNextMonth = new Date(
    Date.UTC(nextYear, normalizedMonth + 1, 0)
  ).getUTCDate();

  nextDate.setUTCDate(1);
  nextDate.setUTCFullYear(nextYear);
  nextDate.setUTCMonth(normalizedMonth);
  nextDate.setUTCDate(
    Math.min(originalDay, lastDayOfNextMonth)
  );

  return nextDate;
}

router.post(
  "/create-subscription",
  requireStudent,
  async (req, res) => {
    try {
      const parsed = createSubscriptionSchema.safeParse(
        req.body
      );

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid AutoPay request.",
        });
      }

      const {
        business,
        product,
        initialOrderId,
      } = parsed.data;

      if (!mongoose.isValidObjectId(initialOrderId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid initial order reference.",
        });
      }

      if (!isAllowedProduct(business, product)) {
        return res.status(400).json({
          success: false,
          message: "AutoPay is not available for this product.",
        });
      }

      const order = await Order.findOne({
        _id: initialOrderId,
        business,
        product,
        studentId: req.student._id,
        paymentStatus: "PAID",
      });

      if (!order || !order.verifiedAt) {
        return res.status(403).json({
          success: false,
          message:
            "Complete and verify your first payment before enabling AutoPay.",
        });
      }

      if (
        !Number.isSafeInteger(order.amountPaise) ||
        order.amountPaise < 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid monthly payment amount.",
        });
      }

      const existingSubscription =
        await AutoPaySubscription.findOne({
          initialOrderId: order._id,
        });

      if (existingSubscription) {
        return res.status(409).json({
          success: false,
          message: "AutoPay setup already exists for this order.",
        });
      }

      const nextBillingDate = getNextMonthlyDate(
        order.verifiedAt
      );

      const startAt = Math.floor(
        nextBillingDate.getTime() / 1000
      );

      if (startAt <= Math.floor(Date.now() / 1000)) {
        return res.status(409).json({
          success: false,
          message:
            "The next billing date has passed. Please contact support to set up AutoPay again.",
        });
      }

      const plan = await createMonthlyPlan({
        business,
        product,
        amountPaise: order.amountPaise,
      });

      const subscription = await createMonthlySubscription({
        business,
        planId: plan.id,
        startAt,
        notes: {
          initialOrderId: String(order._id),
          studentId: String(req.student._id),
          product,
        },
      });

      const savedSubscription =
        await AutoPaySubscription.create({
          business,
          product,
          customer: {
            name: order.customer.name,
            email: order.customer.email,
            mobile: order.customer.mobile,
          },
          studentId: req.student._id,
          initialOrderId: order._id,
          originalAmount: order.originalAmount,
          discountAmount: order.discountAmount,
          monthlyAmount: order.payableAmount,
          amountPaise: order.amountPaise,
          razorpayPlanId: plan.id,
          razorpaySubscriptionId: subscription.id,
          status: "PENDING_AUTH",
          consentAccepted: true,
          consentAcceptedAt: new Date(),
          initialPaymentAt: order.verifiedAt,
          nextBillingAt: nextBillingDate,
          lastPaidAt: order.verifiedAt,
          lastPaymentId: order.razorpayPaymentId,
        });

      const keyId =
        business === "TRILLION_TRADING"
          ? process.env.TRILLION_RAZORPAY_KEY_ID
          : process.env.RIGHT_ALGO_RAZORPAY_KEY_ID;

      return res.status(201).json({
        success: true,
        message: "AutoPay subscription created. Customer authorization is pending.",
        autoPayId: String(savedSubscription._id),
        subscriptionId: subscription.id,
        keyId,
        amount: order.amountPaise,
        currency: "INR",
        nextBillingAt: nextBillingDate,
      });
    } catch (error) {
      console.error("AutoPay subscription creation error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not create AutoPay subscription.",
      });
    }
  }
);


const verifySubscriptionSchema = z.object({
  business: z.enum([
    "TRILLION_TRADING",
    "RIGHT_ALGO_TRADING",
  ]),
  subscriptionId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

router.post(
  "/verify-subscription",
  requireStudent,
  async (req, res) => {
    try {
      const parsed = verifySubscriptionSchema.safeParse(
        req.body
      );

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription verification details.",
        });
      }

      const {
        business,
        subscriptionId,
        paymentId,
        signature,
      } = parsed.data;

      const secret =
        business === "TRILLION_TRADING"
          ? process.env.TRILLION_RAZORPAY_KEY_SECRET
          : process.env.RIGHT_ALGO_RAZORPAY_KEY_SECRET;

      if (!secret) {
        return res.status(500).json({
          success: false,
          message: "Payment verification configuration is missing.",
        });
      }

      const subscriptionRecord =
        await AutoPaySubscription.findOne({
          business,
          razorpaySubscriptionId: subscriptionId,
          studentId: req.student._id,
        });

      if (!subscriptionRecord) {
        return res.status(404).json({
          success: false,
          message: "AutoPay subscription not found.",
        });
      }

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${paymentId}|${subscriptionId}`)
        .digest("hex");

      const receivedBuffer = Buffer.from(signature, "hex");
      const expectedBuffer = Buffer.from(
        expectedSignature,
        "hex"
      );

      const signatureValid =
        /^[a-f0-9]{64}$/i.test(signature) &&
        receivedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(
          receivedBuffer,
          expectedBuffer
        );

      if (!signatureValid) {
        return res.status(400).json({
          success: false,
          message: "AutoPay signature verification failed.",
        });
      }

      const razorpaySubscription =
        await fetchAutoPaySubscription({
          business,
          subscriptionId,
        });

      if (
        razorpaySubscription.id !== subscriptionId ||
        !["authenticated", "active"].includes(
          razorpaySubscription.status
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Razorpay subscription authorization is not confirmed.",
        });
      }

      if (razorpaySubscription.status === "active") {
        subscriptionRecord.status = "ACTIVE";
        subscriptionRecord.activatedAt = new Date();
      }

      await subscriptionRecord.save();

      return res.json({
        success: true,
        message:
          razorpaySubscription.status === "active"
            ? "AutoPay is active."
            : "Mandate authorization verified. AutoPay activation is pending.",
        status: subscriptionRecord.status,
      });
    } catch (error) {
      console.error("AutoPay verification error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to verify AutoPay authorization.",
      });
    }
  }
);


const cancelSubscriptionSchema = z.object({
  business: z.enum([
    "TRILLION_TRADING",
    "RIGHT_ALGO_TRADING",
  ]),
  subscriptionId: z.string().min(1),
});

router.post(
  "/cancel-subscription",
  requireStudent,
  async (req, res) => {
    try {
      const parsed = cancelSubscriptionSchema.safeParse(
        req.body
      );

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid cancellation request.",
        });
      }

      const { business, subscriptionId } = parsed.data;

      const record = await AutoPaySubscription.findOne({
        business,
        razorpaySubscriptionId: subscriptionId,
        studentId: req.student._id,
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: "AutoPay subscription not found.",
        });
      }

      if (
        ["CANCELLED", "COMPLETED"].includes(record.status)
      ) {
        return res.status(409).json({
          success: false,
          message: "Subscription is already inactive.",
        });
      }

      const razorpaySubscription =
        await fetchAutoPaySubscription({
          business,
          subscriptionId,
        });

      if (
        ["cancelled", "completed"].includes(
          razorpaySubscription.status
        )
      ) {
        record.status =
          razorpaySubscription.status.toUpperCase();

        await record.save();

        return res.json({
          success: true,
          message: "Subscription is already inactive.",
          status: record.status,
        });
      }

      await cancelAutoPaySubscription({
        business,
        subscriptionId,
        cancelAtCycleEnd: false,
      });

      record.status = "CANCELLED";
      record.cancelledAt = new Date();

      await record.save();

      return res.json({
        success: true,
        message: "AutoPay cancellation requested successfully.",
        status: record.status,
      });
    } catch (error) {
      console.error("AutoPay cancellation error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to cancel AutoPay subscription.",
      });
    }
  }
);

router.get(
  "/my-subscriptions",
  requireStudent,
  async (req, res) => {
    try {
      const business = req.query.business;

      if (
        business &&
        ![
          "TRILLION_TRADING",
          "RIGHT_ALGO_TRADING",
        ].includes(business)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid business.",
        });
      }

      const filter = {
        studentId: req.student._id,
        ...(business ? { business } : {}),
      };

      const subscriptions =
        await AutoPaySubscription.find(filter)
          .sort({ createdAt: -1 })
          .select(
  "business product monthlyAmount currency status razorpaySubscriptionId nextBillingAt lastPaidAt cancelledAt createdAt"
)
          .lean();

      return res.json({
        success: true,
        subscriptions,
      });
    } catch (error) {
      console.error(
        "AutoPay subscription status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve AutoPay subscriptions.",
      });
    }
  }
);

router.get(
  "/my-payments",
  requireStudent,
  async (req, res) => {
    try {
      const subscriptions = await AutoPaySubscription.find({
        studentId: req.student._id,
      }).select("_id");

      const subscriptionIds = subscriptions.map(
        (subscription) => subscription._id
      );

      const payments = await AutoPayPayment.find({
        autoPaySubscription: { $in: subscriptionIds },
      })
        .sort({ paidAt: -1 })
        .select(
          "business razorpaySubscriptionId razorpayPaymentId amountPaise currency status paidAt"
        )
        .lean();

      return res.json({
        success: true,
        payments,
      });
    } catch (error) {
      console.error("AutoPay payment history error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve AutoPay payment history.",
      });
    }
  }
);

export default router;
