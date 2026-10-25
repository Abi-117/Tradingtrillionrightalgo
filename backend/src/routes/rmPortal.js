
import { Router } from "express";
import { requireRM } from "../middleware/requireRM.js";
import RMClient from "../models/RMClient.js";
import RMWeeklyReport from "../models/RMWeeklyReport.js";
import RMRenewal from "../models/RMRenewal.js";

const router = Router();

router.use(requireRM);

router.get("/dashboard", async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (
      !Number.isInteger(month) || month < 1 || month > 12 ||
      !Number.isInteger(year) || year < 2020 || year > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid month and year.",
      });
    }

    // Always use the authenticated RM ID, never an ID from the query.
    const rmId = req.rm._id;
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));

    const [newClients, allClients, reports, renewals] = await Promise.all([
      RMClient.find({
        rmId,
        firstReferralDate: { $gte: start, $lt: end },
      }).sort({ firstReferralDate: -1 }).lean(),

      RMClient.find({ rmId })
        .sort({ firstReferralDate: -1 })
        .lean(),

      RMWeeklyReport.find({ rmId, year, month })
        .sort({ week: 1 })
        .lean(),

      RMRenewal.find({
        rmId,
        renewalDate: { $gte: start, $lt: end },
      }).populate("clientId", "name mobile").lean(),
    ]);

    const brokerageReceived = reports.reduce(
      (sum, item) => sum + item.brokerageReceived, 0
    );
    const rmSharingAmount = reports.reduce(
      (sum, item) => sum + item.rmSharingAmount, 0
    );
    const renewalAmount = renewals.reduce(
      (sum, item) => sum + item.renewalAmount, 0
    );

    res.json({
      success: true,
      rm: {
        id: String(req.rm._id),
        name: req.rm.name,
        email: req.rm.email,
      },
      period: { month, year },
      totals: {
        activeClients: allClients.filter(c => c.isActive).length,
        newClients: newClients.length,
        renewedClientCount: renewals.length,
        renewalAmount,
        brokerageReceived,
        rmSharingAmount,
        monthEndPayable: rmSharingAmount,
      },
      newClients,
      clients: allClients,
      renewals,
      weeklyReports: reports,
    });
  } catch (error) {
    console.error("RM dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load the RM dashboard.",
    });
  }
});

export default router;
