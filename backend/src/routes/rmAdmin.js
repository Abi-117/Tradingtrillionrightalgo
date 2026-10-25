
import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

import { requireAdmin } from "../middleware/requireAdmin.js";
import RMUser from "../models/RMUser.js";
import RMClient from "../models/RMClient.js";
import RMWeeklyReport from "../models/RMWeeklyReport.js";
import RMRenewal from "../models/RMRenewal.js";

const router = Router();

router.use(requireAdmin);

const uploadDir = path.resolve("uploads/rm-brokerage");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
    cb(
      allowed.has(file.mimetype)
        ? null
        : new Error("Upload a JPG, PNG, or WebP image."),
      allowed.has(file.mimetype)
    );
  },
});

function validMonthYear(month, year) {
  return (
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(year) &&
    year >= 2020 &&
    year <= 2100
  );
}

function parseId(id) {
  return /^[a-f\d]{24}$/i.test(String(id || ""));
}

function amount(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) {
    throw new Error(`${fieldName} must be a valid non-negative amount.`);
  }
  return n;
}

// Create an RM account. The password is hashed before storage.
router.post("/rms", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const mobile = String(req.body?.mobile || "").trim();
    const password = String(req.body?.password || "");

    if (
      name.length < 2 ||
      name.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 150 ||
      !/^\+?[0-9\s()-]{10,15}$/.test(mobile) ||
      password.length < 12 ||
      password.length > 200
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid name, email, mobile, and password of at least 12 characters.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const rm = await RMUser.create({
      name,
      email,
      mobile,
      passwordHash,
    });

    res.status(201).json({
      success: true,
      rm: {
        id: String(rm._id),
        name: rm.name,
        email: rm.email,
        mobile: rm.mobile,
        isActive: rm.isActive,
      },
    });
  } catch (error) {
    const duplicate = error?.code === 11000;
    res.status(duplicate ? 409 : 400).json({
      success: false,
      message: duplicate ? "An RM with this email already exists." : error.message,
    });
  }
});

// List all RMs.
router.get("/rms", async (_req, res) => {
  const rms = await RMUser.find()
    .select("name email mobile isActive createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, rms });
});

// Activate/deactivate an RM account.
router.patch("/rms/:rmId/status", async (req, res) => {
  if (!parseId(req.params.rmId)) {
    return res.status(400).json({ success: false, message: "Invalid RM ID." });
  }

  if (typeof req.body?.isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive must be true or false.",
    });
  }

  const rm = await RMUser.findByIdAndUpdate(
    req.params.rmId,
    { isActive: req.body.isActive },
    { new: true }
  ).select("name email isActive");

  if (!rm) {
    return res.status(404).json({ success: false, message: "RM not found." });
  }

  res.json({ success: true, rm });
});

// Add a client/referral under an RM.
router.post("/clients", async (req, res) => {
  try {
    const { rmId } = req.body || {};
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const mobile = String(req.body?.mobile || "").trim();
    const referralDate = req.body?.firstReferralDate
      ? new Date(req.body.firstReferralDate)
      : new Date();

    if (
      !parseId(rmId) ||
      name.length < 2 ||
      name.length > 100 ||
      !/^\+?[0-9\s()-]{10,15}$/.test(mobile) ||
      (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
      Number.isNaN(referralDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid client details.",
      });
    }

    const rm = await RMUser.findById(rmId);
    if (!rm) {
      return res.status(404).json({ success: false, message: "RM not found." });
    }

    const client = await RMClient.create({
      rmId,
      name,
      email,
      mobile,
      firstReferralDate: referralDate,
    });

    res.status(201).json({ success: true, client });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// All clients, optionally filtered by RM.
router.get("/clients", async (req, res) => {
  const filter = {};
  if (req.query.rmId) {
    if (!parseId(req.query.rmId)) {
      return res.status(400).json({ success: false, message: "Invalid RM ID." });
    }
    filter.rmId = req.query.rmId;
  }

  const clients = await RMClient.find(filter)
    .populate("rmId", "name email")
    .sort({ firstReferralDate: -1 })
    .lean();

  res.json({ success: true, clients });
});

// Create/update one weekly report; amount entry is manual.
router.put("/weekly-report", imageUpload.single("screenshot"), async (req, res) => {
  try {
    const rmId = String(req.body?.rmId || "");
    const year = Number(req.body?.year);
    const month = Number(req.body?.month);
    const week = Number(req.body?.week);

    if (
      !parseId(rmId) ||
      !validMonthYear(month, year) ||
      !Number.isInteger(week) ||
      week < 1 ||
      week > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid RM, month, year, or week.",
      });
    }

    const rm = await RMUser.findById(rmId);
    if (!rm) {
      return res.status(404).json({ success: false, message: "RM not found." });
    }

    const brokerageReceived = amount(
      req.body?.brokerageReceived ?? 0,
      "Brokerage received"
    );
    const rmSharingAmount = amount(
      req.body?.rmSharingAmount ?? 0,
      "RM sharing amount"
    );

    const update = {
      brokerageReceived,
      rmSharingAmount,
      notes: String(req.body?.notes || "").slice(0, 2000),
      updatedBy: req.admin?._id || null,
    };

    if (req.file) {
      update.screenshotUrl = `/uploads/rm-brokerage/${req.file.filename}`;
    }

    const report = await RMWeeklyReport.findOneAndUpdate(
      { rmId, year, month, week },
      { $set: update, $setOnInsert: { rmId, year, month, week } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, report });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// All weekly reports; optional filters.
router.get("/weekly-reports", async (req, res) => {
  const filter = {};

  if (req.query.rmId) {
    if (!parseId(req.query.rmId)) {
      return res.status(400).json({ success: false, message: "Invalid RM ID." });
    }
    filter.rmId = req.query.rmId;
  }

  if (req.query.month !== undefined || req.query.year !== undefined) {
    const month = Number(req.query.month);
    const year = Number(req.query.year);
    if (!validMonthYear(month, year)) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid month and year together.",
      });
    }
    filter.month = month;
    filter.year = year;
  }

  const reports = await RMWeeklyReport.find(filter)
    .populate("rmId", "name email")
    .sort({ year: -1, month: -1, week: 1 })
    .lean();

  res.json({ success: true, reports });
});

// Record a client renewal independently of new referrals.
router.post("/renewals", async (req, res) => {
  try {
    const { rmId, clientId } = req.body || {};
    const renewalDate = req.body?.renewalDate
      ? new Date(req.body.renewalDate)
      : new Date();

    if (
      !parseId(rmId) ||
      !parseId(clientId) ||
      Number.isNaN(renewalDate.getTime())
    ) {
      return res.status(400).json({ success: false, message: "Invalid renewal details." });
    }

    const renewalAmount = amount(req.body?.renewalAmount, "Renewal amount");
    const client = await RMClient.findOne({ _id: clientId, rmId });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found under this RM.",
      });
    }

    const renewal = await RMRenewal.create({
      rmId,
      clientId,
      renewalDate,
      renewalAmount,
      notes: String(req.body?.notes || "").slice(0, 1000),
    });

    res.status(201).json({ success: true, renewal });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Month summary: new clients, renewals, weekly brokerage and sharing.
router.get("/summary", async (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  if (!validMonthYear(month, year)) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid month and year.",
    });
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const rmId = req.query.rmId ? String(req.query.rmId) : "";

  if (rmId && !parseId(rmId)) {
    return res.status(400).json({ success: false, message: "Invalid RM ID." });
  }

  const clientFilter = {
    firstReferralDate: { $gte: start, $lt: end },
  };
  const renewalFilter = {
    renewalDate: { $gte: start, $lt: end },
  };
  const reportFilter = { year, month };

  if (rmId) {
    clientFilter.rmId = rmId;
    renewalFilter.rmId = rmId;
    reportFilter.rmId = rmId;
  }

  const [newClients, renewals, reports, activeClients, rms] = await Promise.all([
    RMClient.countDocuments(clientFilter),
    RMRenewal.find(renewalFilter).select("renewalAmount").lean(),
    RMWeeklyReport.find(reportFilter).populate("rmId", "name email").lean(),
    RMClient.countDocuments({
      ...(rmId ? { rmId } : {}),
      isActive: true,
    }),
    rmId
      ? RMUser.find({ _id: rmId }).select("name email").lean()
      : RMUser.find().select("name email").lean(),
  ]);

  const brokerageTotal = reports.reduce(
    (sum, report) => sum + report.brokerageReceived, 0
  );
  const sharingTotal = reports.reduce(
    (sum, report) => sum + report.rmSharingAmount, 0
  );
  const renewalTotal = renewals.reduce(
    (sum, renewal) => sum + renewal.renewalAmount, 0
  );

  res.json({
    success: true,
    period: { month, year },
    totals: {
      newClients,
      activeClients,
      renewedClientCount: renewals.length,
      renewalAmount: renewalTotal,
      brokerageReceived: brokerageTotal,
      rmSharingAmount: sharingTotal,
      monthEndPayable: sharingTotal,
    },
    rms,
    reports,
  });
});

router.get("/renewals", async (req, res) => {
  try {
    const renewals = await RMRenewal.find()
      .populate("rmId", "name email")
      .populate("clientId", "name mobile email")
      .sort({ renewalDate: -1 });

    return res.status(200).json({ renewals });
  } catch (error) {
    console.error("Failed to load RM renewals:", error);
    return res.status(500).json({
      message: "Failed to load renewal records.",
    });
  }
});


export default router;
