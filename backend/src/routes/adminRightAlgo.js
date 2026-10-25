
import { Router } from "express";
import Order from "../models/Order.js";
import RightAlgoRegistration from "../models/RightAlgoRegistration.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.use(requireAdmin);

// Right Algo dashboard summary
router.get("/summary", async (req, res, next) => {
  try {
    const business = "RIGHT_ALGO_TRADING";

    const [data] = await Order.aggregate([
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

    const registrationCount =
      await RightAlgoRegistration.countDocuments({});

    const paidRegistrationCount =
      await RightAlgoRegistration.countDocuments({
        registrationPaymentStatus: "PAID",
      });

    return res.json({
      success: true,
      business,
      summary: {
        totalOrders: data?.totalOrders ?? 0,
        paidOrders: data?.paidOrders ?? 0,
        pendingOrders: data?.pendingOrders ?? 0,
        failedOrders: data?.failedOrders ?? 0,
        verifiedRevenuePaise: data?.verifiedRevenuePaise ?? 0,
        verifiedRevenueRupees:
          (data?.verifiedRevenuePaise ?? 0) / 100,
        totalRegistrations: registrationCount,
        paidRegistrations: paidRegistrationCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Right Algo orders only
router.get("/orders", async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
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

    if (status && status !== "ALL" &&
        !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status.",
      });
    }

    const filter = { business: "RIGHT_ALGO_TRADING" };

    if (status && status !== "ALL") {
      filter.paymentStatus = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select(
          "business product customer originalAmount discountAmount payableAmount amountPaise currency paymentStatus razorpayOrderId razorpayPaymentId receiptNumber registrationId createdAt verifiedAt"
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      business: "RIGHT_ALGO_TRADING",
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

// Right Algo registrations only
router.get("/registrations", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit || 20))
    );

    if (!Number.isInteger(page) || !Number.isInteger(limit)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values.",
      });
    }

    const [registrations, total] = await Promise.all([
      RightAlgoRegistration.find({})
        .select(
          "name email mobile experience registrationPaymentStatus registrationOrderId registrationPaymentId registrationVerifiedAt createdAt"
        )
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RightAlgoRegistration.countDocuments({}),
    ]);

    return res.json({
      success: true,
      registrations,
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
