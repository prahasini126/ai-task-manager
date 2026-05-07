const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-task-manager-lovat-seven.vercel.app",
  "https://ai-task-manager-8pmjrohgq-mellam-prahasinis-projects.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});