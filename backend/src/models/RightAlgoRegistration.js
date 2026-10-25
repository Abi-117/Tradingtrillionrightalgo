
import mongoose from "mongoose";

const rightAlgoRegistrationSchema = new mongoose.Schema(
  {
    // Link this registration to the logged-in student account.
    // Optional so existing registration records continue to work.
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15,
    },

    experience: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },

    termsAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },

    riskAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },

    registrationPaymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
      required: true,
    },

    registrationOrderId: {
      type: String,
      default: null,
    },

    registrationPaymentId: {
      type: String,
      default: null,
    },

    registrationVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

rightAlgoRegistrationSchema.index({
  email: 1,
  mobile: 1,
  createdAt: -1,
});

rightAlgoRegistrationSchema.index(
  { registrationOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      registrationOrderId: { $type: "string" },
    },
  },
);

export default mongoose.model(
  "RightAlgoRegistration",
  rightAlgoRegistrationSchema,
);
