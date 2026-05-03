import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const API = "https://ai-task-manager-hx0o.onrender.com";

const COLORS = [
  { bg: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" },
  { bg: "bg-violet-500", light: "bg-violet-50", text: "text-violet-600" },
  { bg: "bg-rose-500", light: "bg-rose-50", text: "text-rose-600" },
  { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600" },
  { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600" },
  { bg: "bg-cyan-500", light: "bg-cyan-50", text: "text-cyan-600" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => { fetchBoards(); }, []);

  const fetchBoards = async () => {
    try {
      const res = await axios.get(`${API}/api/boards`);
      setBoards(res.data);
    } catch {
      toast.error("Failed to load boards");
    } finally {
      setLoading(false);
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    setCreating(true);
    try {
      const res = await axios.post(`${API}/api/boards`, { title: newBoardTitle });
      setBoards([res.data, ...boards]);
      setNewBoardTitle("");
      setShowInput(false);
      toast.success("Board created!");
    } catch {
      toast.error("Failed to create board");
    } finally {
      setCreating(false);
    }
  };

  const deleteBoard = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/api/boards/${id}`);
      setBoards(boards.filter(b => b.id !== id));
      toast.success("Board deleted");
    } catch {
      toast.error("Failed to delete board");
    }
  };

  return (
    <div style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}
      className="min-h-screen bg-[#f5f5f7]">
      <nav className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">⚡</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">TaskAI</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">{user?.name?.[0]?.toUpperCase()}</span>
            </div>
            <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
            <button onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-900 transition px-3 py-1.5 rounded-lg hover:bg-gray-100">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm text-gray-500 mb-1">Good day,</p>
            <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">{user?.name}</h1>
          </div>
          <button onClick={() => setShowInput(!showInput)}
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-black/20">
            <span className="text-lg leading-none">+</span> New Board
          </button>
        </div>

        {showInput && (
          <form onSubmit={createBoard}
            className="bg-white rounded-2xl border border-gray-200 p-5 mb-8 flex gap-3 shadow-sm">
            <input autoFocus
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              placeholder="Board name..."
              value={newBoardTitle}
              onChange={e => setNewBoardTitle(e.target.value)} />
            <button type="submit" disabled={creating}
              className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition">
              {creating ? "Creating..." : "Create"}
            </button>
            <button type="button" onClick={() => setShowInput(false)}
              className="text-gray-400 hover:text-gray-600 px-3 py-2.5 rounded-xl hover:bg-gray-100 transition text-sm">
              Cancel
            </button>
          </form>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-36 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-gray-900 font-medium mb-1">No boards yet</h3>
            <p className="text-gray-500 text-sm">Create your first board to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board, i) => {
              const color = COLORS[i % COLORS.length];
              return (
                <div key={board.id}
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="group bg-white rounded-2xl border border-gray-100 p-6 cursor-pointer hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`w-10 h-10 ${color.bg} rounded-xl flex items-center justify-center shadow-sm`}>
                      <span className="text-white text-sm font-semibold">{board.title[0].toUpperCase()}</span>
                    </div>
                    <button onClick={(e) => deleteBoard(board.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition text-lg leading-none">×</button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{board.title}</h3>
                  <p className="text-xs text-gray-400">
                    {new Date(board.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}