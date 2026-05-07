require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

prisma.$connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ Database error:", err.message));

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/boards", require("./routes/boards"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/ai", require("./routes/ai"));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join-board", (boardId) => socket.join(boardId));
  socket.on("task-moved", (data) => socket.to(data.boardId).emit("task-updated", data));
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));