import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Bot, Send, Sparkles, Loader2 } from "lucide-react";
import { useUIStore } from "@/store";
import { aiApi } from "@/api";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "table" | "stats" | "card";
  data?: { headers?: string[]; rows?: string[][]; stats?: { label: string; value: string; color: string }[] };
}

const SUGGESTIONS = [
  "What's my revenue today?",
  "Which products are low on stock?",
  "Show pending orders",
  "Top customers this month",
  "Sales summary",
  "Help me with...",
];

export function AIPanel() {
  const { aiPanelOpen, toggleAiPanel } = useUIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: "assistant", content: "Hello! I'm your AI assistant. I can help you with orders, inventory, analytics, and more. Try asking about revenue, stock, or customers!", type: "text" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMessage = { id: Date.now(), role: "user", content: text, type: "text" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Send prompt to the backend AI API
      const response = await aiApi.simulate(text);

      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.aiReply,
        type: "text",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "I'm sorry, I couldn't process your request right now. Please try again later or check if the backend is running.",
        type: "text",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping]);

  return (
    <AnimatePresence>
      {aiPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 340, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-50 flex flex-col bg-white h-full shrink-0 overflow-hidden md:relative md:inset-auto md:z-auto md:border-l md:border-slate-100"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-slate-100">
            <div className="p-1.5 rounded-lg bg-primary-50">
              <Bot size={14} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-800">AI Assistant</p>
              <p className="text-[10px] text-green-500 font-medium">● Online</p>
            </div>
            <button onClick={toggleAiPanel} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={msg.role === "user" ? "flex justify-end" : "flex gap-2"}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={11} className="text-primary-600" />
                  </div>
                )}
                <div
                  className={`max-w-[88%] px-3 py-2 rounded-xl text-xs ${
                    msg.role === "user"
                      ? "bg-primary-600 text-white"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Stats Display */}
                  {msg.type === "stats" && msg.data?.stats && (
                    <div className="mt-2 space-y-1.5">
                      {msg.data.stats.map((stat, i) => (
                        <div key={i} className="flex justify-between items-center bg-white rounded-lg px-2.5 py-1.5 border border-slate-100">
                          <span className="text-[10px] text-slate-500">{stat.label}</span>
                          <span className="text-[10px] font-bold" style={{ color: stat.color }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Table Display */}
                  {msg.type === "table" && msg.data?.headers && msg.data?.rows && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="border-b border-slate-200">
                            {msg.data.headers.map((h) => (
                              <th key={h} className="text-left py-1 pr-2 text-slate-400 font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {msg.data.rows.map((row, i) => (
                            <tr key={i} className="border-b border-slate-100 last:border-0">
                              {row.map((cell, j) => (
                                <td key={j} className="py-1 pr-2 text-slate-600">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Loader2 size={11} className="text-primary-600 animate-spin" />
                </div>
                <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-slate-400"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={endRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[10px] bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-700 border border-slate-200 hover:border-primary-200 px-2 py-1 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-100">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Ask anything..."
                disabled={isTyping}
                className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:opacity-50"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || isTyping}
                className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
