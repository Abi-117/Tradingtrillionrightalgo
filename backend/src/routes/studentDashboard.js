
import { Router } from "express";
import Order from "../models/Order.js";
import { requireStudent } from "../middleware/requireStudent.js";

const router = Router();

// Get the logged-in student's Trillion Trading profile and payment history.
router.get("/", requireStudent, async (req, res, next) => {
  try {
    const student = req.student;

    const orders = await Order.find({
      business: "TRILLION_TRADING",
      studentId: student._id,
    })
      .select(
        "product originalAmount discountAmount payableAmount currency paymentStatus receiptNumber razorpayOrderId razorpayPaymentId createdAt verifiedAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      business: "TRILLION_TRADING",
      student: {
        id: String(student._id),
        name: student.name,
        email: student.email,
        mobile: student.mobile,
      },
      orders: orders.map((order) => ({
        id: String(order._id),
        product: order.product,
        originalAmount: order.originalAmount,
        discountAmount: order.discountAmount,
        amountPaid: order.payableAmount,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        receiptNumber: order.receiptNumber,
        orderReference: order.razorpayOrderId,
        paymentReference: order.razorpayPaymentId,
        createdAt: order.createdAt,
        verifiedAt: order.verifiedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
