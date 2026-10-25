
import mongoose from "mongoose";

const rmUserSchema = new mongoose.Schema(
  {
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
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
      maxlength: 15,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, strict: "throw" }
);

export default mongoose.model("RMUser", rmUserSchema);
