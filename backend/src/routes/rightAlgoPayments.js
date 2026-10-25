
import { Router } from "express";
import crypto, { randomUUID, timingSafeEqual } from "crypto";
import mongoose from "mongoose";
import { z } from "zod";

import Software from "../models/Software.js";
import Order from "../models/Order.js";
import RightAlgoRegistration from "../models/RightAlgoRegistration.js";
import { getRightAlgoRazorpay } from "../services/rightAlgoRazorpay.js";
import { requireStudent } from "../middleware/requireStudent.js";

const router = Router();

const BUSINESS = "RIGHT_ALGO_TRADING";
const REGISTRATION_PRODUCT = "REGISTRATION";
const SOFTWARE_PRODUCT = "RIGHT_SOFTWARE";
const REGISTRATION_FEE = Number(
  process.env.RIGHT_ALGO_REGISTRATION_FEE || 2000
);

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  mobile: z.string().trim().regex(/^\+?[0-9\s()-]{10,15}$/),
  experience: z.string().trim().max(80).optional().default(""),
  terms: z.preprocess(
    (v) => v === true || v === "on" || v === "true",
    z.literal(true)
  ),
  risk: z.preprocess(
    (v) => v === true || v === "on" || v === "true",
    z.literal(true)
  ),
});

const createOrderSchema = z.object({
  productId: z.enum([REGISTRATION_PRODUCT, SOFTWARE_PRODUCT]),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(150),
  phone: z.string().trim().regex(/^\+?[0-9\s()-]{10,15}$/),
  registrationId: z.string().optional(),
  couponCode: z.string().trim().max(50).optional(),
});

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
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

  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");

  return (
    left.length > 0 &&
    left.length === right.length &&
    timingSafeEqual(left, right)
  );
}

function normalizeMobile(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function safeOrderResponse(order, razorpayOrder, productName) {
  return {
    success: true,
    business: BUSINESS,
    internalOrderId: String(order._id),
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    productId: order.product,
    productName,
    keyId: process.env.RIGHT_ALGO_RAZORPAY_KEY_ID,
  };
}

// Create Right Algo registration for the logged-in student.
router.post("/register", requireStudent, async (req, res) => {
  try {
    const parsed = registrationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          "Enter valid contact details and accept the Terms and Risk Disclosure.",
      });
    }

    const student = req.student;
    const { name, email, mobile, experience, terms, risk } = parsed.data;

    // Prevent registration details from being attached to another account.
    if (
      email.toLowerCase() !== student.email.toLowerCase() ||
      normalizeMobile(mobile) !== normalizeMobile(student.mobile) ||
      name.trim().toLowerCase() !== student.name.trim().toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Your registration details must match your student account. Please check your profile details.",
      });
    }

    const registration = await RightAlgoRegistration.create({
      studentId: student._id,
      name: student.name,
      email: student.email.toLowerCase(),
      mobile: student.mobile,
      experience,
      termsAccepted: terms,
      riskAccepted: risk,
      registrationPaymentStatus: "PENDING",
    });

    return res.status(201).json({
      success: true,
      registrationId: String(registration._id),
      message:
        "Registration details saved. Complete the registration payment.",
    });
  } catch (error) {
    console.error("Right Algo registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration could not be saved.",
    });
  }
});

// Create a payment order for the authenticated student.
router.post("/payments/create-order", requireStudent, async (req, res) => {
  let savedOrder;

  try {
    const parsed = createOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Please check the customer and product details.",
      });
    }

    const student = req.student;
    const { productId, registrationId } = parsed.data;

    let originalAmount;
    let registration = null;
    let productName;

    if (productId === REGISTRATION_PRODUCT) {
      if (!Number.isSafeInteger(REGISTRATION_FEE) || REGISTRATION_FEE < 1) {
        return res.status(500).json({
          success: false,
          message: "Right Algo registration fee is misconfigured.",
        });
      }

      if (!registrationId || !mongoose.isValidObjectId(registrationId)) {
        return res.status(400).json({
          success: false,
          message: "A valid registration reference is required.",
        });
      }

      registration = await RightAlgoRegistration.findOne({
        _id: registrationId,
        studentId: student._id,
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration record was not found for this account.",
        });
      }

      if (registration.registrationPaymentStatus === "PAID") {
        return res.status(409).json({
          success: false,
          message: "This registration is already paid.",
        });
      }

      originalAmount = REGISTRATION_FEE;
      productName = "Right Algo Trading Registration";
    } else {
      const software = await Software.findOne({
        business: BUSINESS,
        productId: SOFTWARE_PRODUCT,
        active: true,
      });

      if (
        !software ||
        !Number.isSafeInteger(software.price) ||
        software.price < 1
      ) {
        return res.status(404).json({
          success: false,
          message: "Right Algo software is unavailable or incorrectly priced.",
        });
      }

      // Software purchase requires a paid registration belonging
      // to this same student account.
      const paidRegistration = await RightAlgoRegistration.findOne({
        studentId: student._id,
        registrationPaymentStatus: "PAID",
      }).sort({ registrationVerifiedAt: -1, createdAt: -1 });

      if (!paidRegistration) {
        return res.status(403).json({
          success: false,
          message:
            "Complete and verify your Right Algo registration before buying the software.",
        });
      }

      originalAmount = software.price;
      productName = software.name || "Right Algo Trading Software";
      registration = paidRegistration;
    }

    const amountPaise = originalAmount * 100;

    if (!Number.isSafeInteger(amountPaise)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount.",
      });
    }

    savedOrder = await Order.create({
      business: BUSINESS,
      product: productId,
      studentId: student._id,
      registrationId: registration?._id || null,
      customer: {
        name: student.name,
        email: student.email,
        mobile: student.mobile,
      },
      couponCode: null,
      originalAmount,
      discountAmount: 0,
      payableAmount: originalAmount,
      amountPaise,
      currency: "INR",
      paymentStatus: "PENDING",
    });

    const internalOrderId = String(savedOrder._id);

    const razorpayOrder = await getRightAlgoRazorpay().orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `RAL-${randomUUID().replaceAll("-", "").slice(0, 24)}`,
      notes: {
        business: BUSINESS,
        productId,
        internalOrderId,
        registrationId: registration ? String(registration._id) : "",
      },
    });

    savedOrder.razorpayOrderId = razorpayOrder.id;
    await savedOrder.save();

    if (productId === REGISTRATION_PRODUCT) {
      registration.registrationOrderId = razorpayOrder.id;
      await registration.save();
    }

    return res
      .status(201)
      .json(safeOrderResponse(savedOrder, razorpayOrder, productName));
  } catch (error) {
    console.error("Right Algo create-order error:", error);

    if (savedOrder) {
      await Order.updateOne(
        {
          _id: savedOrder._id,
          business: BUSINESS,
          paymentStatus: "PENDING",
        },
        { $set: { paymentStatus: "FAILED" } }
      ).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: "Could not create the Right Algo payment order.",
    });
  }
});

// Verify payment only for the student who owns the order.
router.post("/payments/verify", requireStudent, async (req, res) => {
  try {
    const parsed = verifySchema.safeParse(req.body);

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
      business: BUSINESS,
      razorpayOrderId: razorpay_order_id,
      studentId: req.student._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Right Algo payment order not found for this account.",
      });
    }

    const secret = process.env.RIGHT_ALGO_RAZORPAY_KEY_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Right Algo payment verification is not configured.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!safeEqualHex(expectedSignature, razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Right Algo payment signature verification failed.",
      });
    }

    const payment = await getRightAlgoRazorpay().payments.fetch(
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

    if (order.paymentStatus !== "PAID") {
      const updated = await Order.findOneAndUpdate(
        {
          _id: order._id,
          business: BUSINESS,
          studentId: req.student._id,
          paymentStatus: { $ne: "PAID" },
        },
        {
          $set: {
            paymentStatus: "PAID",
            razorpayPaymentId: razorpay_payment_id,
            verifiedAt: new Date(),
            receiptNumber: `RAL-${String(order._id).slice(-12).toUpperCase()}`,
          },
        },
        { returnDocument: "after" }
      );

      if (!updated) {
        const current = await Order.findOne({
          _id: order._id,
          business: BUSINESS,
          studentId: req.student._id,
        });

        if (current?.paymentStatus !== "PAID") {
          return res.status(409).json({
            success: false,
            message: "Could not confirm order status.",
          });
        }
      }
    } else if (order.razorpayPaymentId !== razorpay_payment_id) {
      return res.status(409).json({
        success: false,
        message: "This order was already verified with a different payment.",
      });
    }

    if (order.product === REGISTRATION_PRODUCT) {
      const registration = await RightAlgoRegistration.findOne({
        _id: order.registrationId,
        studentId: req.student._id,
        registrationOrderId: razorpay_order_id,
      });

      if (!registration) {
        return res.status(409).json({
          success: false,
          message: "The related registration record could not be found.",
        });
      }

      if (registration.registrationPaymentStatus !== "PAID") {
        registration.registrationPaymentStatus = "PAID";
        registration.registrationPaymentId = razorpay_payment_id;
        registration.registrationVerifiedAt = new Date();
        await registration.save();
      }
    }

    const paidOrder = await Order.findOne({
      _id: order._id,
      business: BUSINESS,
      studentId: req.student._id,
    });

    return res.json({
      success: true,
      verified: true,
      business: BUSINESS,
      orderId: razorpay_order_id,
      paymentStatus: "PAID",
      product: order.product,
      amount: order.payableAmount,
      paymentId: razorpay_payment_id,
      receiptNumber: paidOrder?.receiptNumber || order.receiptNumber,
    });
  } catch (error) {
    console.error("Right Algo verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Right Algo payment verification could not be completed.",
    });
  }
});

// Return a verified paid order only to its owning student.
router.get("/orders/:id", requireStudent, async (req, res) => {
  try {
    const order = await Order.findOne({
      business: BUSINESS,
      studentId: req.student._id,
      paymentStatus: "PAID",
      $or: [
        { razorpayOrderId: req.params.id },
        ...(mongoose.isValidObjectId(req.params.id)
          ? [{ _id: req.params.id }]
          : []),
      ],
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No verified Right Algo purchase was found for this account.",
      });
    }

    return res.json({
      success: true,
      verified: true,
      business: BUSINESS,
      orderId: order.razorpayOrderId,
      product: order.product,
      amount: order.payableAmount,
      paymentId: order.razorpayPaymentId,
      receiptNumber: order.receiptNumber,
      customer: order.customer,
      onboarding:
        order.product === REGISTRATION_PRODUCT
          ? "Registration payment verified. Your software purchase is separate. Use Daily Login for the external trading platform."
          : "Software payment verified. Keep your payment reference for support.",
    });
  } catch (error) {
    console.error("Right Algo get-order error:", error);
    return res.status(500).json({
      success: false,
      message: "Could not retrieve the Right Algo payment status.",
    });
  }
});

export default router;
