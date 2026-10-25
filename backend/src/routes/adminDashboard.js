
import { Router } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import Student from "../models/Student.js";
import RightAlgoRegistration from "../models/RightAlgoRegistration.js";

const router = Router();

// All dashboard endpoints require an authenticated admin.
router.use(requireAdmin);

// GET /api/admin/dashboard/students?page=1&limit=20&business=ALL
router.get("/students", async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const business = String(req.query.business || "ALL");

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values.",
      });
    }

    const allowedBusinesses = [
      "ALL",
      "TRILLION_TRADING",
      "RIGHT_ALGO_TRADING",
    ];

    if (!allowedBusinesses.includes(business)) {
      return res.status(400).json({
        success: false,
        message: "Invalid business filter.",
      });
    }

    const filter = { isActive: true };

    const [students, total] = await Promise.all([
      Student.find(filter)
        .select("name email mobile isActive lastLoginAt createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Student.countDocuments(filter),
    ]);

    const studentIds = students.map((student) => student._id);

    const orderFilter = {
      studentId: { $in: studentIds },
    };

    if (business !== "ALL") {
      orderFilter.business = business;
    }

    const orders = studentIds.length
      ? await Order.find(orderFilter)
          .select(
            "studentId business product originalAmount discountAmount payableAmount amountPaise currency paymentStatus razorpayOrderId razorpayPaymentId receiptNumber createdAt verifiedAt"
          )
          .sort({ createdAt: -1, _id: -1 })
          .lean()
      : [];

    const registrations =
  business === "TRILLION_TRADING" || studentIds.length === 0
    ? []
    : await RightAlgoRegistration.find({
        studentId: { $in: studentIds },
      })
        .select(
          "studentId name email mobile experience termsAccepted riskAccepted registrationPaymentStatus registrationOrderId registrationPaymentId registrationVerifiedAt createdAt"
        )
        .sort({ createdAt: -1, _id: -1 })
        .lean();

const registrationsByStudent = new Map();

for (const registration of registrations) {
  const studentId = String(registration.studentId);

  if (!registrationsByStudent.has(studentId)) {
    registrationsByStudent.set(studentId, []);
  }

  registrationsByStudent.get(studentId).push({
    id: String(registration._id),
    name: registration.name,
    email: registration.email,
    mobile: registration.mobile,
    experience: registration.experience,
    termsAccepted: registration.termsAccepted,
    riskAccepted: registration.riskAccepted,
    paymentStatus: registration.registrationPaymentStatus,
    registrationOrderId: registration.registrationOrderId,
    registrationPaymentId: registration.registrationPaymentId,
    verifiedAt: registration.registrationVerifiedAt,
    createdAt: registration.createdAt,
  });
}

    const ordersByStudent = new Map();

    for (const order of orders) {
      const studentId = String(order.studentId);

      if (!ordersByStudent.has(studentId)) {
        ordersByStudent.set(studentId, []);
      }

      ordersByStudent.get(studentId).push({
        id: String(order._id),
        business: order.business,
        product: order.product,
        originalAmount: order.originalAmount,
        discountAmount: order.discountAmount,
        payableAmount: order.payableAmount,
        amountPaise: order.amountPaise,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        receiptNumber: order.receiptNumber,
        createdAt: order.createdAt,
        verifiedAt: order.verifiedAt,
      });
    }

    const result = students.map((student) => ({
  id: String(student._id),
  name: student.name,
  email: student.email,
  mobile: student.mobile,
  isActive: student.isActive,
  lastLoginAt: student.lastLoginAt,
  registeredAt: student.createdAt,
  orders: ordersByStudent.get(String(student._id)) || [],
  registrations:
    registrationsByStudent.get(String(student._id)) || [],
}));

    return res.json({
      success: true,
      students: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/dashboard/summary
router.get("/summary", async (req, res, next) => {
  try {
    const business = "TRILLION_TRADING";

    const [summary] = await Order.aggregate([
      { $match: { business } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },

          paidOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "PAID"] }, 1, 0],
            },
          },

          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "PENDING"] }, 1, 0],
            },
          },

          failedOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "FAILED"] }, 1, 0],
            },
          },

          refundedOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "REFUNDED"] }, 1, 0],
            },
          },

          verifiedRevenuePaise: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "PAID"] },
                "$amountPaise",
                0,
              ],
            },
          },
        },
      },
    ]);

    const data = summary || {
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      failedOrders: 0,
      refundedOrders: 0,
      verifiedRevenuePaise: 0,
    };

    return res.json({
      success: true,
      business,
      summary: {
        totalOrders: data.totalOrders,
        paidOrders: data.paidOrders,
        pendingOrders: data.pendingOrders,
        failedOrders: data.failedOrders,
        refundedOrders: data.refundedOrders,
        verifiedRevenuePaise: data.verifiedRevenuePaise,
        verifiedRevenueRupees: data.verifiedRevenuePaise / 100,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/dashboard/orders?page=1&limit=10&status=PAID
router.get("/orders", async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const status = req.query.status;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values.",
      });
    }

    const allowedStatuses = [
      "PENDING",
      "PAID",
      "FAILED",
      "REFUNDED",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    const filter = { business: "TRILLION_TRADING" };

    if (status) {
      filter.paymentStatus = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select(
          "business product customer.name customer.email customer.mobile originalAmount discountAmount payableAmount amountPaise currency paymentStatus razorpayOrderId razorpayPaymentId receiptNumber createdAt verifiedAt"
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Order.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      business: "TRILLION_TRADING",
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
