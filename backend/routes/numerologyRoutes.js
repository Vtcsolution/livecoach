const express = require("express");
const router = express.Router();
const { getNumerologyReport, generateNumerologyReport } = require("../controllers/numerologyController");
const { getUserReportModal } = require("../controllers/numerologyController");

router.post("/generate-numerology-report", generateNumerologyReport);
router.get("/numerology-report", getNumerologyReport);
router.get("/user-report-modal/:id", getUserReportModal);

module.exports = router;