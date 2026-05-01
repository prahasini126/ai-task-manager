require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getCompletion = async (prompt) => {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "You are a JSON-only response bot. You NEVER explain anything. You ONLY output raw valid JSON. No markdown, no backticks, no extra text before or after the JSON."
      },
      { role: "user", content: prompt }
    ],
    max_tokens: 300,
    temperature: 0.3,
  });
  const raw = response.choices[0].message.content.trim();
  // Strip any accidental backticks or markdown
  return raw.replace(/```json|```/g, "").trim();
};

// Generate subtasks
exports.generateSubtasks = async (req, res) => {
  try {
    const { taskTitle } = req.body;
    if (!taskTitle) return res.status(400).json({ message: "Task title required" });

    const content = await getCompletion(
      `Return a JSON array of 4-5 actionable subtasks for: "${taskTitle}".
       Output format: ["subtask 1", "subtask 2", "subtask 3", "subtask 4"]`
    );
    const subtasks = JSON.parse(content);
    res.json({ subtasks });
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ message: "AI error", error: err.message });
  }
};

// Suggest priority
exports.suggestPriority = async (req, res) => {
  try {
    const { taskTitle, description } = req.body;
    if (!taskTitle) return res.status(400).json({ message: "Task title required" });

    const content = await getCompletion(
      `Suggest priority for this task: "${taskTitle}". Description: "${description || "none"}".
       Output format: {"priority": "high", "reason": "one sentence reason"}
       Priority must be exactly one of: high, medium, low`
    );
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ message: "AI error", error: err.message });
  }
};

// Daily summary
exports.getDailySummary = async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!tasks || tasks.length === 0)
      return res.json({ summary: "No tasks found. Create some tasks to get a summary!" });

    const taskList = tasks.map(t =>
      `- "${t.title}" (priority: ${t.priority}, status: ${t.status})`
    ).join("\n");

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a helpful productivity assistant. Give brief, motivating summaries."
        },
        {
          role: "user",
          content: `Here are my tasks:\n${taskList}\n\nGive a 3-4 sentence motivating summary.`
        }
      ],
      max_tokens: 200,
    });

    const summary = response.choices[0].message.content.trim();
    res.json({ summary });
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ message: "AI error", error: err.message });
  }
};