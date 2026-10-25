
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

async function createAdmin() {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD are required."
    );
  }

  if (ADMIN_PASSWORD.length < 12) {
    throw new Error(
      "Use an initial admin password with at least 12 characters."
    );
  }

  await mongoose.connect(MONGODB_URI);

  try {
    const email = ADMIN_EMAIL.toLowerCase().trim();
    const existing = await Admin.findOne({ email });

    if (existing) {
      console.log("Admin already exists. No changes made.");
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await Admin.create({
      name: "Super Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    });

    console.log("Initial super admin created successfully.");
    console.log(`Admin email: ${email}`);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin().catch((error) => {
  console.error("Admin setup failed:", error.message);
  process.exitCode = 1;
});
