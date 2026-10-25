
import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import Report from "../models/Report.js";
import cloudinary from "../config/cloudinary.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG and WebP images are allowed.")
      );
    }

    callback(null, true);
  },
});

router.use(requireAdmin);

function uploadImage(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "right-algo-trading/daily-reports",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Image upload failed"));
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

// List Right Algo reports only
router.get("/", async (req, res, next) => {
  try {
    const reports = await Report.find({
      category: "RIGHT_ALGO_TRADING",
    })
      .sort({ reportDate: -1, createdAt: -1 })
      .lean();

    return res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
});

// Create Right Algo report
router.post("/", upload.single("image"), async (req, res, next) => {
  let uploadedImage;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a report image.",
      });
    }

    const schema = z.object({
      title: z.string().trim().min(2).max(150),
      description: z.string().trim().max(2000).optional().default(""),
      reportDate: z.coerce.date(),
      published: z.enum(["true", "false"]).optional().default("false"),
    });

    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Please check the report details.",
      });
    }

    uploadedImage = await uploadImage(req.file.buffer);

    const report = await Report.create({
      title: parsed.data.title,
      description: parsed.data.description,
      reportDate: parsed.data.reportDate,
      category: "RIGHT_ALGO_TRADING",
      imageUrl: uploadedImage.secure_url,
      imagePublicId: uploadedImage.public_id,
      published: parsed.data.published === "true",
      createdBy: req.admin._id,
    });

    return res.status(201).json({
      success: true,
      message: "Right Algo report uploaded successfully.",
      report,
    });
  } catch (error) {
    if (uploadedImage?.public_id) {
      await cloudinary.uploader
        .destroy(uploadedImage.public_id)
        .catch(() => {});
    }

    next(error);
  }
});

// Publish / unpublish Right Algo report
router.patch("/:id", async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    const parsed = z.object({
      published: z.boolean(),
    }).strict().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "A valid published value is required.",
      });
    }

    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        category: "RIGHT_ALGO_TRADING",
      },
      { $set: { published: parsed.data.published } },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Right Algo report not found.",
      });
    }

    return res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
});

// Delete Right Algo report and its Cloudinary image
router.delete("/:id", async (req, res, next) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID.",
      });
    }

    const report = await Report.findOne({
      _id: req.params.id,
      category: "RIGHT_ALGO_TRADING",
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Right Algo report not found.",
      });
    }

    if (report.imagePublicId) {
      await cloudinary.uploader.destroy(report.imagePublicId);
    }

    await report.deleteOne();

    return res.json({
      success: true,
      message: "Right Algo report deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
