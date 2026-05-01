const express = require("express");
const router = express.Router();
const { getBoards, createBoard, deleteBoard, getBoard } = require("../controllers/boardController");
const verifyToken = require("../middleware/auth");

router.get("/", verifyToken, getBoards);
router.post("/", verifyToken, createBoard);
router.get("/:id", verifyToken, getBoard);
router.delete("/:id", verifyToken, deleteBoard);

module.exports = router;