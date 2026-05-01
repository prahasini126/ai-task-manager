require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get all boards for logged in user
exports.getBoards = async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Create a new board
exports.createBoard = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const board = await prisma.board.create({
      data: { title, userId: req.user.id },
    });

    // Auto-create 3 default lists
    await prisma.list.createMany({
      data: [
        { title: "To Do", order: 0, boardId: board.id },
        { title: "In Progress", order: 1, boardId: board.id },
        { title: "Done", order: 2, boardId: board.id },
      ],
    });

    res.status(201).json(board);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete a board
exports.deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete subtasks → tasks → lists → board (in order)
    const lists = await prisma.list.findMany({ where: { boardId: id } });
    for (const list of lists) {
      const tasks = await prisma.task.findMany({ where: { listId: list.id } });
      for (const task of tasks) {
        await prisma.subtask.deleteMany({ where: { taskId: task.id } });
      }
      await prisma.task.deleteMany({ where: { listId: list.id } });
    }
    await prisma.list.deleteMany({ where: { boardId: id } });
    await prisma.board.delete({ where: { id } });

    res.json({ message: "Board deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get single board with lists and tasks
exports.getBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        lists: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
              include: { subtasks: true },
            },
          },
        },
      },
    });
    if (!board) return res.status(404).json({ message: "Board not found" });
    res.json(board);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};