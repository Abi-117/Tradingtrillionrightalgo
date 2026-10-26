
import { Router } from "express";
import crypto from "crypto";
import { randomUUID, timingSafeEqual } from "crypto";
import { z } from "zod";
import mongoose from "mongoose";

import Course from "../models/Course.js";
import Software from "../models/Software.js";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import razorpay from "../services/trillionRazorpay.js";
import { requireStudent } from "../middleware/requireStudent.js";

const router = Router();
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Trillion payment router is working",
  });
});


const createOrderSchema = z.object({
  productId: z.enum([
    "LEVEL_1",
    "LEVEL_2",
    "COURSE_PACKAGE",
    "SOFTWARE",
    "SHORT_TERM_BREAKOUT",
  ]),
  couponCode: z.string().trim().max(50).optional(),
});


function safeEqualHex(a, b) {
  if (
    typeof a !== "string" ||
    typeof b !== "string" ||
    !/^[a-f0-9]+$/i.test(a) ||
    !/^[a-f0-9]+$/i.test(b)
  ) {
    return false;
  }

  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");

  return (
    bufferA.length === bufferB.length &&
    bufferA.length > 0 &&
    timingSafeEqual(bufferA, bufferB)
  );
}

async function getProduct(productId) {
  if (
    productId === "SOFTWARE" ||
    productId === "SHORT_TERM_BREAKOUT"
  ) {
    return Software.findOne({
      business: "TRILLION_TRADING",
      productId,
      active: true,
    });
  }

  return Course.findOne({
    business: "TRILLION_TRADING",
    productId,
    active: true,
  });
}

// Create Razorpay order - student login required
router.post(
  "/create-order",
  requireStudent,
  async (req, res, next) => {
    let savedOrder;

    try {
      const parsed = createOrderSchema.safeParse(req.body);

if (!parsed.success) {
  console.error(
    "[CREATE ORDER ERROR]",
    JSON.stringify({
      body: req.body,
      errors: parsed.error.flatten(),
    }, null, 2)
  );

  return res.status(400).json({
    success: false,
    message: "Please check the customer and product details.",
    errors: parsed.error.flatten(),
  });
}

      const { productId, couponCode } = parsed.data;
      const student = req.student;

      const product = await getProduct(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product is unavailable.",
        });
      }

      const originalAmount = product.price;

      if (
        !Number.isSafeInteger(originalAmount) ||
        originalAmount <= 0
      ) {
        return res.status(500).json({
          success: false,
          message: "Product price is not configured correctly.",
        });
      }

      let discountAmount = 0;
      let appliedCoupon = null;

      if (couponCode) {
        const normalizedCode = couponCode.toUpperCase();

        const coupon = await Coupon.findOne({
          business: "TRILLION_TRADING",
          code: normalizedCode,
          products: productId,
          active: true,
          startsAt: { $lte: new Date() },
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
          ],
        });

        if (!coupon) {
          return res.status(400).json({
            success: false,
            message: "Coupon is invalid or expired.",
          });
        }

        if (
          coupon.maxUses > 0 &&
          coupon.usedCount >= coupon.maxUses
        ) {
          return res.status(400).json({
            success: false,
            message: "This coupon has reached its usage limit.",
          });
        }

        if (
          !Number.isSafeInteger(coupon.discountAmount) ||
          coupon.discountAmount <= 0 ||
          coupon.discountAmount >= originalAmount
        ) {
          return res.status(400).json({
            success: false,
            message: "Coupon discount is not valid for this product.",
          });
        }

        discountAmount = coupon.discountAmount;
        appliedCoupon = normalizedCode;
      }

      const payableAmount = originalAmount - discountAmount;
      const amountPaise = payableAmount * 100;

      if (!Number.isSafeInteger(amountPaise)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment amount.",
        });
      }

      const internalOrderId = randomUUID();

      // Associate this order with the authenticated student.
      savedOrder = await Order.create({
        business: "TRILLION_TRADING",
        product: productId,
        studentId: student._id,
        customer: {
          name: student.name,
          email: student.email,
          mobile: student.mobile,
        },
        couponCode: appliedCoupon,
        originalAmount,
        discountAmount,
        payableAmount,
        amountPaise,
        currency: "INR",
        paymentStatus: "PENDING",
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `TRI-${internalOrderId.replaceAll("-", "").slice(0, 30)}`,
        notes: {
          business: "TRILLION_TRADING",
          productId,
          internalOrderId: String(savedOrder._id),
        },
      });

      savedOrder.razorpayOrderId = razorpayOrder.id;
      await savedOrder.save();

      return res.status(201).json({
        success: true,
        business: "TRILLION_TRADING",
        internalOrderId: String(savedOrder._id),
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        productId,
        productName: product.name,
        keyId: process.env.TRILLION_RAZORPAY_KEY_ID,
      });
    } catch (error) {
      if (savedOrder) {
        await Order.updateOne(
          {
            _id: savedOrder._id,
            paymentStatus: "PENDING",
          },
          { $set: { paymentStatus: "FAILED" } }
        ).catch(() => {});
      }

      next(error);
    }
  }
);

// Verify payment - only the order's student can verify it
router.post(
  "/verify",
  requireStudent,
  async (req, res, next) => {
    try {
      const schema = z.object({
        razorpay_order_id: z.string().min(1),
        razorpay_payment_id: z.string().min(1),
        razorpay_signature: z.string().min(1),
      });

      const parsed = schema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment verification details.",
        });
      }

      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = parsed.data;

      const order = await Order.findOne({
        business: "TRILLION_TRADING",
        razorpayOrderId: razorpay_order_id,
        studentId: req.student._id,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Payment order not found for this student.",
        });
      }

      const expectedSignature = crypto
        .createHmac(
          "sha256",
          process.env.TRILLION_RAZORPAY_KEY_SECRET
        )
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (!safeEqualHex(expectedSignature, razorpay_signature)) {
        return res.status(400).json({
          success: false,
          message: "Payment signature verification failed.",
        });
      }

      // Independently confirm payment details with Razorpay.
      const payment = await razorpay.payments.fetch(
        razorpay_payment_id
      );

      if (
        payment.order_id !== razorpay_order_id ||
        payment.amount !== order.amountPaise ||
        payment.currency !== "INR" ||
        payment.status !== "captured"
      ) {
        return res.status(400).json({
          success: false,
          message: "Payment is not confirmed as captured.",
        });
      }

      // Idempotent update: never process a paid order twice.
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          business: "TRILLION_TRADING",
          studentId: req.student._id,
          paymentStatus: { $ne: "PAID" },
        },
        {
          $set: {
            paymentStatus: "PAID",
            razorpayPaymentId: razorpay_payment_id,
            verifiedAt: new Date(),
            receiptNumber: `TRI-${String(order._id).slice(-12).toUpperCase()}`,
          },
        },
        { returnDocument: "after" }
      );

      if (!updatedOrder && order.paymentStatus !== "PAID") {
        return res.status(409).json({
          success: false,
          message: "Could not update the order status. Please contact support.",
        });
      }

      if (updatedOrder && order.couponCode) {
        await Coupon.updateOne(
          {
            business: "TRILLION_TRADING",
            code: order.couponCode,
          },
          { $inc: { usedCount: 1 } }
        );
      }

      const paidOrder = await Order.findOne({
  _id: order._id,
  business: "TRILLION_TRADING",
  studentId: req.student._id,
});

return res.json({
  success: true,
  verified: true,
  business: "TRILLION_TRADING",
  orderId: razorpay_order_id,
  paymentStatus: "PAID",
  product: paidOrder?.product || order.product,
  amount: paidOrder?.payableAmount ?? order.payableAmount,
  paymentId: razorpay_payment_id,
  receiptNumber:
    paidOrder?.receiptNumber ||
    updatedOrder?.receiptNumber ||
    order.receiptNumber,
});
    } catch (error) {
      next(error);
    }
  }
);

/* Get a verified payment belonging to the logged-in Trillion student */
// GET /screener-access
router.get("/orders/:orderId", requireStudent, async (req, res, next) => {
    try {
      const paidOrder = await Order.findOne({
        business: "TRILLION_TRADING",
        product: "SHORT_TERM_BREAKOUT",
        studentId: req.student._id,
        paymentStatus: "PAID",
      }).lean();

      if (!paidOrder) {
        return res.status(403).json({
          success: false,
          hasAccess: false,
          message: "Please purchase the Short-Term Breakout Screener first.",
        });
      }

      return res.json({
        success: true,
        hasAccess: true,
        product: "SHORT_TERM_BREAKOUT",
        screenerUrl:
          "https://chartink.com/screener/short-term-breakouts",
      });
    } catch (error) {
      next(error);
    }
  }
);

/* Get a verified order for the logged-in Trillion student */
router.get(
  "/payments/orders/:orderId",
  requireStudent,
  async (req, res, next) => {
    try {
      const order = await Order.findOne({
        business: "TRILLION_TRADING",
        razorpayOrderId: req.params.orderId,
        studentId: req.student._id,
        paymentStatus: "PAID",
      }).lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "No verified purchase is available.",
        });
      }

      return res.json({
        success: true,
        verified: true,
        business: "TRILLION_TRADING",
        orderId: order.razorpayOrderId,
        paymentStatus: order.paymentStatus,
        product: order.product,
        amount: order.payableAmount,
        paymentId: order.razorpayPaymentId,
        receiptNumber: order.receiptNumber,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
