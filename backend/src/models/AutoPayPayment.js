import mongoose from "mongoose";

const autoPayPaymentSchema = new mongoose.Schema(
  {
    business: {
      type: String,
      enum: ["TRILLION_TRADING", "RIGHT_ALGO_TRADING"],
      required: true,
    },

    autoPaySubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutoPaySubscription",
      required: true,
    },

    razorpaySubscriptionId: {
      type: String,
      required: true,
    },

    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
    },

    amountPaise: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: ["CAPTURED"],
      default: "CAPTURED",
    },

    paidAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

autoPayPaymentSchema.index({
  autoPaySubscription: 1,
  paidAt: -1,
});

export default mongoose.model(
  "AutoPayPayment",
  autoPayPaymentSchema
);