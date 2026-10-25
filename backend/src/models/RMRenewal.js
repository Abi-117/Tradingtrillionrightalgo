
import mongoose from "mongoose";

const rmRenewalSchema = new mongoose.Schema(
  {
    rmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RMUser",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RMClient",
      required: true,
    },
    renewalDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    renewalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true, strict: "throw" }
);

rmRenewalSchema.index({ rmId: 1, renewalDate: -1 });

export default mongoose.model("RMRenewal", rmRenewalSchema);
