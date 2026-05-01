require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create task
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, listId } = req.body;
    if (!title || !listId) return res.status(400).json({ message: "Title and listId required" });

    const count = await prisma.task.count({ where: { listId } });
    const task = await prisma.task.create({
      data: { title, description, priority: priority || "medium", dueDate: dueDate ? new Date(dueDate) : null, order: count, listId },
      include: { subtasks: true },
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Move task to different list
exports.moveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { listId, order } = req.body;
    const task = await prisma.task.update({
      where: { id },
      data: { listId, order },
      include: { subtasks: true },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate } = req.body;
    const task = await prisma.task.update({
      where: { id },
      data: { title, description, priority, dueDate: dueDate ? new Date(dueDate) : null },
      include: { subtasks: true },
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subtask.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Toggle subtask
exports.toggleSubtask = async (req, res) => {
  try {
    const { id } = req.params;
    const subtask = await prisma.subtask.findUnique({ where: { id } });
    const updated = await prisma.subtask.update({
      where: { id },
      data: { done: !subtask.done },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};