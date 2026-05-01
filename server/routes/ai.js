const express = require("express");
const router = express.Router();
const { generateSubtasks, suggestPriority, getDailySummary } = require("../controllers/aiController");
const verifyToken = require("../middleware/auth");

router.post("/subtasks", verifyToken, generateSubtasks);
router.post("/priority", verifyToken, suggestPriority);
router.post("/summary", verifyToken, getDailySummary);

module.exports = router;