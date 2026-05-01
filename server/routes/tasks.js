const express = require("express");
const router = express.Router();
const { createTask, moveTask, updateTask, deleteTask, toggleSubtask } = require("../controllers/taskController");
const verifyToken = require("../middleware/auth");

router.post("/", verifyToken, createTask);
router.patch("/:id/move", verifyToken, moveTask);
router.patch("/:id", verifyToken, updateTask);
router.delete("/:id", verifyToken, deleteTask);
router.patch("/subtask/:id/toggle", verifyToken, toggleSubtask);

module.exports = router;