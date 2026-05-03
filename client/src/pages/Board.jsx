import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import toast from "react-hot-toast";

const API = "https://ai-task-manager-hx0o.onrender.com";

const PRIORITY_STYLES = {
  high: { dot: "bg-red-400", badge: "bg-red-50 text-red-500 border-red-100" },
  medium: { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-500 border-amber-100" },
  low: { dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-500 border-emerald-100" },
};

const COLUMN_STYLES = [
  { accent: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" },
  { accent: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600" },
  { accent: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600" },
];

export default function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState({});
  const [addingTo, setAddingTo] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [prioritySuggestion, setPrioritySuggestion] = useState(null);

  useEffect(() => { fetchBoard(); }, [id]);

  const fetchBoard = async () => {
    try {
      const res = await axios.get(`${API}/api/boards/${id}`);
      setBoard(res.data);
    } catch {
      toast.error("Failed to load board");
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newBoard = { ...board };
    const sourceList = newBoard.lists.find(l => l.id === source.droppableId);
    const destList = newBoard.lists.find(l => l.id === destination.droppableId);
    const [movedTask] = sourceList.tasks.splice(source.index, 1);
    movedTask.listId = destination.droppableId;
    destList.tasks.splice(destination.index, 0, movedTask);
    setBoard(newBoard);
    try {
      await axios.patch(`${API}/api/tasks/${draggableId}/move`, {
        listId: destination.droppableId, order: destination.index,
      });
    } catch {
      toast.error("Failed to move task");
      fetchBoard();
    }
  };

  const createTask = async (listId) => {
    const title = newTaskTitle[listId];
    if (!title?.trim()) return;
    try {
      const res = await axios.post(`${API}/api/tasks`, { title, listId });
      const newBoard = { ...board };
      newBoard.lists.find(l => l.id === listId).tasks.push(res.data);
      setBoard(newBoard);
      setNewTaskTitle({ ...newTaskTitle, [listId]: "" });
      setAddingTo(null);
      toast.success("Task added");
    } catch {
      toast.error("Failed to create task");
    }
  };

  const deleteTask = async (taskId, listId) => {
    try {
      await axios.delete(`${API}/api/tasks/${taskId}`);
      const newBoard = { ...board };
      const list = newBoard.lists.find(l => l.id === listId);
      list.tasks = list.tasks.filter(t => t.id !== taskId);
      setBoard(newBoard);
      if (selectedTask?.id === taskId) setSelectedTask(null);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const generateSubtasks = async (task) => {
    setAiLoading(true);
    setSubtasks([]);
    setPrioritySuggestion(null);
    try {
      const res = await axios.post(`${API}/api/ai/subtasks`, { taskTitle: task.title });
      setSubtasks(res.data.subtasks);
    } catch {
      toast.error("AI unavailable");
    } finally {
      setAiLoading(false);
    }
  };

  const suggestPriority = async (task) => {
    setAiLoading(true);
    setPrioritySuggestion(null);
    try {
      const res = await axios.post(`${API}/api/ai/priority`, {
        taskTitle: task.title, description: task.description
      });
      setPrioritySuggestion(res.data);
    } catch {
      toast.error("AI unavailable");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}
      className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <nav className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition">
              ← Boards
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <h1 className="text-sm font-semibold text-gray-900">{board?.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
              <span className="text-white text-xs">⚡</span>
            </div>
            <span className="text-sm font-medium text-gray-900">TaskAI</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-8 overflow-x-auto">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-5 min-w-max items-start">
              {board?.lists.map((list, i) => {
                const style = COLUMN_STYLES[i % COLUMN_STYLES.length];
                return (
                  <div key={list.id} className="w-72 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${style.accent}`} />
                        <span className="text-sm font-semibold text-gray-700">{list.title}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.light} ${style.text}`}>
                        {list.tasks.length}
                      </span>
                    </div>

                    <Droppable droppableId={list.id}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          className={`flex-1 min-h-20 space-y-2.5 rounded-2xl p-2 transition-colors ${snapshot.isDraggingOver ? "bg-gray-200/50" : ""}`}>
                          {list.tasks.map((task, index) => {
                            const p = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
                            return (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => { setSelectedTask(task); setSubtasks([]); setPrioritySuggestion(null); }}
                                    className={`bg-white rounded-xl p-4 group cursor-pointer border transition-all duration-150
                                      ${snapshot.isDragging ? "shadow-xl shadow-black/10 rotate-1 scale-105" : "shadow-sm shadow-black/5 hover:shadow-md"}
                                      ${selectedTask?.id === task.id ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100 hover:border-gray-200"}`}>
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm font-medium text-gray-800 leading-snug flex-1">{task.title}</p>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id, list.id); }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition text-base leading-none mt-0.5">
                                        ×
                                      </button>
                                    </div>
                                    {task.description && (
                                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{task.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-3">
                                      <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border font-medium ${p.badge}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                                        {task.priority}
                                      </div>
                                      {task.subtasks?.length > 0 && (
                                        <span className="text-xs text-gray-400">
                                          {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    <div className="mt-2 px-2">
                      {addingTo === list.id ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2 shadow-sm">
                          <input autoFocus
                            className="w-full text-sm bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none"
                            placeholder="Task title..."
                            value={newTaskTitle[list.id] || ""}
                            onChange={e => setNewTaskTitle({ ...newTaskTitle, [list.id]: e.target.value })}
                            onKeyDown={e => e.key === "Enter" && createTask(list.id)} />
                          <div className="flex gap-2">
                            <button onClick={() => createTask(list.id)}
                              className="bg-black text-white text-xs px-3 py-1.5 rounded-lg font-medium transition hover:bg-gray-800">
                              Add
                            </button>
                            <button onClick={() => setAddingTo(null)}
                              className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1.5 transition">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setAddingTo(list.id)}
                          className="w-full text-left text-sm text-gray-400 hover:text-gray-600 py-2 px-3 rounded-xl hover:bg-white transition-all duration-150 flex items-center gap-2">
                          <span className="text-base leading-none">+</span> Add task
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>

        {selectedTask && (
          <div className="w-72 bg-white border-l border-gray-100 flex flex-col shadow-xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">✦</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
              </div>
              <button onClick={() => setSelectedTask(null)}
                className="text-gray-300 hover:text-gray-500 transition text-lg leading-none">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm font-medium text-gray-800">{selectedTask.title}</p>
              </div>

              <div>
                <button onClick={() => generateSubtasks(selectedTask)} disabled={aiLoading}
                  className="w-full bg-black hover:bg-gray-800 disabled:opacity-40 text-white text-sm py-2.5 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2">
                  {aiLoading ? <><span className="animate-spin">◌</span> Thinking...</> : <><span>✦</span> Generate Subtasks</>}
                </button>
                {subtasks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Suggested subtasks</p>
                    {subtasks.map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <p className="text-xs text-gray-600 leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button onClick={() => suggestPriority(selectedTask)} disabled={aiLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 disabled:opacity-40 text-white text-sm py-2.5 px-4 rounded-xl font-medium transition flex items-center justify-center gap-2">
                  {aiLoading ? <><span className="animate-spin">◌</span> Analyzing...</> : <><span>◎</span> Suggest Priority</>}
                </button>
                {prioritySuggestion && (
                  <div className="mt-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">Suggested:</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${PRIORITY_STYLES[prioritySuggestion.priority]?.badge || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {prioritySuggestion.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{prioritySuggestion.reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}