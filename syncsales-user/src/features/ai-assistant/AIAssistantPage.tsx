import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Loader2, Plus, MessageSquare, Trash2 } from "lucide-react";
import { aiApi, type AiModelOption } from "@/api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "table" | "stats" | "card";
  data?: { headers?: string[]; rows?: string[][]; stats?: { label: string; value: string; color: string }[] };
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

const LOCAL_STORAGE_KEY = "syncsales_ai_chats";

export default function AIAssistantPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [models, setModels] = useState<AiModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);

  // Load sessions from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } else {
        // Create initial session
        handleNewChat();
      }
    } catch (e) {
      console.error("Failed to load chats from local storage", e);
      handleNewChat();
    }
  }, []);

  // Save sessions to local storage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    aiApi.getModels().then(res => {
      const data = res?.data;
      if (data) {
        const local = data.local_providers || [];
        const openrouter = data.openrouter_models || [];
        const allModels = [...local, ...openrouter];
        setModels(allModels);
        if (allModels.length > 0) {
          setSelectedModel(allModels[0].id);
          setSelectedProvider(allModels[0].provider);
        }
      }
    }).catch(console.error);
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      updatedAt: Date.now(),
      messages: [
        { id: Date.now(), role: "assistant", content: "Hello! I'm your AI business assistant. How can I help you today?", type: "text" }
      ],
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        setTimeout(handleNewChat, 0);
        return [];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isTyping || !activeSessionId) return;

    const userMsg: ChatMessage = { id: Date.now(), role: "user", content: text, type: "text" };
    
    // Update local state first
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        // Auto-generate title for new chats based on first message
        const newTitle = session.messages.length === 1 ? text.slice(0, 30) + (text.length > 30 ? "..." : "") : session.title;
        return {
          ...session,
          title: newTitle,
          updatedAt: Date.now(),
          messages: [...session.messages, userMsg]
        };
      }
      return session;
    }).sort((a, b) => b.updatedAt - a.updatedAt));

    setInput("");
    setIsTyping(true);

    try {
      // Send prompt to the backend AI API
      const response = await aiApi.simulate(text, undefined, selectedProvider, selectedModel);

      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.aiReply,
        type: "text",
      };
      
      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            updatedAt: Date.now(),
            messages: [...session.messages, aiMsg]
          };
        }
        return session;
      }));
    } catch {
      const errMsg: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "I'm sorry, I couldn't process your request right now.",
        type: "text",
      };
      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            updatedAt: Date.now(),
            messages: [...session.messages, errMsg]
          };
        }
        return session;
      }));
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, selectedProvider, selectedModel, activeSessionId]);

  return (
    <div className="flex h-[calc(100vh-8rem)] sm:h-[calc(100vh-5.5rem)] bg-surface text-foreground overflow-hidden rounded-xl border border-border shadow-sm">
      {/* ─── Left Sidebar (History) ──────────────────────────────────────────────────────── */}
      <div className="w-64 bg-background border-r border-border flex flex-col shrink-0 hidden md:flex">
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg hover:bg-surface-elevated text-sm text-foreground transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-surface text-primary-foreground flex items-center justify-center">
              <Plus size={16} />
            </div>
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1 scrollbar-thin">
          <p className="text-xs font-semibold text-foreground-muted mb-2 px-2 mt-4">Chat History</p>
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={cn(
                "group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                activeSessionId === session.id ? "bg-surface-elevated text-foreground" : "hover:bg-surface text-foreground-muted"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare size={14} className="shrink-0 opacity-70" />
                <span className="truncate">{session.title}</span>
              </div>
              <button
                onClick={(e) => handleDeleteChat(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-error transition-all shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* User / Settings Area */}
        <div className="p-3 border-t border-border">
          {models.length > 0 && (
            <select
              value={selectedModel}
              onChange={(e) => {
                const m = models.find(x => x.id === e.target.value);
                if (m) {
                  setSelectedModel(m.id);
                  setSelectedProvider(m.provider);
                }
              }}
              className="w-full bg-surface-elevated text-xs text-foreground rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ─── Main Chat Area ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">AI Assistant</span>
            <span className="text-xs text-foreground-muted ml-2 bg-surface-elevated px-2 py-0.5 rounded-full">v3.5</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin flex flex-col items-center">
          <div className="w-full max-w-3xl space-y-6">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                {/* Avatar */}
                <div className="shrink-0 mt-1">
                  {msg.role === "assistant" ? (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-foreground shadow-sm">
                      <Sparkles size={16} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-foreground shadow-sm">
                      <span className="text-xs font-semibold">U</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1 min-w-0">
                  <p className="font-semibold text-sm mb-1 text-foreground">
                    {msg.role === "assistant" ? "AI Assistant" : "You"}
                  </p>
                  <div className="text-sm text-foreground-muted leading-relaxed prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Stats Display */}
                    {msg.type === "stats" && msg.data?.stats && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {msg.data.stats.map((stat, i) => (
                          <div key={i} className="flex flex-col bg-surface-elevated rounded-xl p-3 border border-border">
                            <span className="text-[10px] text-foreground-muted uppercase tracking-wider">{stat.label}</span>
                            <span className="text-lg font-bold mt-1" style={{ color: stat.color }}>{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Table Display */}
                    {msg.type === "table" && msg.data?.headers && msg.data?.rows && (
                      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface-elevated">
                        <table className="w-full text-left text-sm text-foreground-muted">
                          <thead className="text-xs uppercase bg-surface-elevated text-foreground-muted">
                            <tr>
                              {msg.data.headers.map((h) => (
                                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.data.rows.map((row, i) => (
                              <tr key={i} className="border-b border-border last:border-0 hover:bg-surface-elevated/50">
                                {row.map((cell, j) => (
                                  <td key={j} className="px-4 py-3 whitespace-nowrap">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-foreground shadow-sm">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                </div>
                <div className="flex-1 pt-2.5">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-surface-elevated0"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={endRef} className="h-4" />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 pb-6 w-full max-w-4xl mx-auto shrink-0">
          <div className="relative flex items-end gap-2 bg-surface-elevated rounded-2xl border border-border p-2 shadow-sm focus-within:ring-1 focus-within:ring-primary/40 transition-shadow">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Message AI Assistant..."
              disabled={isTyping}
              className="flex-1 max-h-48 min-h-[44px] bg-transparent text-sm text-foreground px-3 py-3 focus:outline-none resize-none scrollbar-thin disabled:opacity-50"
              rows={1}
              style={{
                height: "auto",
              }}
              ref={(el) => {
                if (el) {
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
                }
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isTyping}
              className="p-2 mb-1 mr-1 rounded-xl bg-surface-elevated text-foreground hover:bg-surface disabled:opacity-30 disabled:bg-surface-elevated disabled:text-foreground-muted transition-colors shrink-0"
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-foreground-muted mt-3">
            AI Assistant can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
