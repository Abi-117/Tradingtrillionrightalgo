
import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import Report from "../models/Report.js";
import cloudinary from "../config/cloudinary.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, callback) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG and WebP images are allowed."),
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
        folder: "trillion-trading/daily-reports",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) {
          console.error("CLOUDINARY UPLOAD ERROR:", error);
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary returned no upload result"));
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
}


// GET: List reports
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find({
      category: "TRILLION_TRADING",
    })
      .sort({ reportDate: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("ADMIN_REPORTS_GET_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load reports.",
    });
  }
});

// POST: Create report
router.post("/", upload.single("image"), async (req, res) => {
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
      category: "TRILLION_TRADING",
      imageUrl: uploadedImage.secure_url,
      imagePublicId: uploadedImage.public_id,
      published: parsed.data.published === "true",
      createdBy: req.admin._id,
    });

    return res.status(201).json({
      success: true,
      message: "Daily report uploaded successfully.",
      report,
    });
  } catch (error) {
    console.error("ADMIN_REPORTS_POST_ERROR:", error);

    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error("CLOUDINARY_CLEANUP_ERROR:", cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to upload report. Check the backend terminal.",
    });
  }
});

// PATCH: Publish / unpublish
router.patch("/:id", async (req, res) => {
  try {
    const parsed = z.object({
      published: z.boolean(),
    }).safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "A valid published value is required.",
      });
    }

    const report = await Report.findOneAndUpdate(
      {
        _id: req.params.id,
        category: "TRILLION_TRADING",
      },
      {
        $set: { published: parsed.data.published },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    return res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("ADMIN_REPORTS_PATCH_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update report.",
    });
  }
});

// DELETE: Remove report
router.delete("/:id", async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      category: "TRILLION_TRADING",
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (report.imagePublicId) {
      await cloudinary.uploader.destroy(report.imagePublicId);
    }

    await report.deleteOne();

    return res.json({
      success: true,
      message: "Report deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN_REPORTS_DELETE_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete report.",
    });
  }
});

export default router;
