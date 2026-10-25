
import mongoose from "mongoose";

const rmClientSchema = new mongoose.Schema(
  {
    rmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RMUser",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 150,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15,
    },
    firstReferralDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, strict: "throw" }
);

rmClientSchema.index({ rmId: 1, firstReferralDate: -1 });

export default mongoose.model("RMClient", rmClientSchema);
