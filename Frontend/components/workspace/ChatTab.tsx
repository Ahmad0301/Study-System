"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  User,
  Lightbulb,
  Plus,
  MessageSquare,
  Trash2,
  Edit3,
  MoreVertical,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { aiService } from "@/lib/services/aiService";
import { useToast } from "@/hooks/use-toast";

const PROMPT_CHIPS = [
  "Explain main concepts covered in these documents",
  "Summarize key definitions and core formulas",
  "Generate 3 practice quiz questions based on notes",
];

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp?: string;
}

interface ChatSessionItem {
  _id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

interface ChatTabProps {
  subjectId?: string;
  selectedFileIds?: string[];
}

function MarkdownText({ content }: { content: string }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const firstLine = lines[0].trim();
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : "code";
          const codeText = hasLang ? lines.slice(1).join("\n") : lines.join("\n");

          return (
            <div
              key={index}
              className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 font-mono text-xs shadow-lg"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-blue-400">{lang}</span>
                <button
                  onClick={() => copyCode(codeText, index)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors text-[11px] font-sans px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  {copiedIdx === index ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedIdx === index ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed font-mono whitespace-pre">
                {codeText}
              </pre>
            </div>
          );
        }

        return (
          <div key={index} className="space-y-1">
            {part.split("\n").map((line, lineIdx) => {
              if (!line.trim()) return <div key={lineIdx} className="h-1" />;

              if (line.startsWith("### ")) {
                return (
                  <h4 key={lineIdx} className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 mt-3 mb-1">
                    {line.replace("### ", "")}
                  </h4>
                );
              }
              if (line.startsWith("## ")) {
                return (
                  <h3 key={lineIdx} className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-4 mb-1">
                    {line.replace("## ", "")}
                  </h3>
                );
              }
              if (line.startsWith("# ")) {
                return (
                  <h2 key={lineIdx} className="font-black text-lg text-slate-900 dark:text-slate-100 mt-4 mb-2">
                    {line.replace("# ", "")}
                  </h2>
                );
              }

              if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
                const listContent = line.trim().substring(2);
                return (
                  <div key={lineIdx} className="flex items-start gap-2 ml-2 my-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <span>{formatFormattedText(listContent)}</span>
                  </div>
                );
              }

              return <p key={lineIdx}>{formatFormattedText(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function formatFormattedText(text: string) {
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`(.*?)`/g,
      '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[11px]">$1</code>'
    );

  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
}

export default function ChatTab({ subjectId, selectedFileIds = [] }: ChatTabProps) {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load chat sessions from backend — wrapped in try/catch so backend restart doesn't crash the page
  useEffect(() => {
    let isMounted = true;
    aiService.getChatSessions(subjectId)
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setSessions(data);
          if (data.length > 0) {
            setActiveSessionId(data[0]._id);
            setMessages(data[0].messages || []);
          }
        }
      })
      .catch(() => {
        // Backend may be starting up — silently ignore, sidebar will be empty
      });
    return () => {
      isMounted = false;
    };
  }, [subjectId]);

  // Sync messages when active session changes
  useEffect(() => {
    if (!activeSessionId) return;
    const current = sessions.find((s) => s._id === activeSessionId);
    if (current) {
      setMessages(current.messages || []);
    } else {
      aiService.getChatSession(activeSessionId).then((session) => {
        if (session) setMessages(session.messages || []);
      });
    }
  }, [activeSessionId, sessions]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const handleNewChat = async () => {
    if (!subjectId) {
      toast({
        title: "No Subject Selected",
        description: "Please select a course subject first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const safeFileIds = Array.isArray(selectedFileIds) ? selectedFileIds : [];
      const newSession = await aiService.createChatSession({
        subjectId,
        fileIds: safeFileIds,
        title: "New Conversation",
      });

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession._id);
      setMessages([]);
    } catch (err: any) {
      toast({
        title: "Error Creating Chat",
        description: err?.message || "Failed to start new chat session.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    if (!subjectId) {
      toast({
        title: "No Subject Selected",
        description: "Please select a course subject first.",
        variant: "destructive",
      });
      return;
    }

    let targetSessionId = activeSessionId;

    // Create session on the fly if none exists
    if (!targetSessionId) {
      try {
        const safeFileIds = Array.isArray(selectedFileIds) ? selectedFileIds : [];
        const newSession = await aiService.createChatSession({
          subjectId,
          fileIds: safeFileIds,
          title: textToSend.slice(0, 30) + "...",
        });
        targetSessionId = newSession._id;
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession._id);
      } catch (err: any) {
        toast({
          title: "Session Error",
          description: "Could not initialize chat session.",
          variant: "destructive",
        });
        return;
      }
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setTyping(true);

    if (!targetSessionId) return;

    try {
      const updatedSession = await aiService.sendSessionMessage(targetSessionId, userMsg.text);
      setMessages(updatedSession.messages || []);
      setSessions((prev) =>
        prev.map((s) => (s._id === targetSessionId ? updatedSession : s))
      );
    } catch (err: any) {
      toast({
        title: "AI Response Error",
        description: err?.message || "Failed to get AI completion.",
        variant: "destructive",
      });
    } finally {
      setTyping(false);
    }
  };

  const handleRenameSession = async (sessionId: string) => {
    if (!editingTitleText.trim()) return;
    try {
      const updated = await aiService.renameChatSession(sessionId, editingTitleText.trim());
      setSessions((prev) => prev.map((s) => (s._id === sessionId ? updated : s)));
      setEditingTitleId(null);
      setMenuOpenId(null);
    } catch (_) {
      toast({ title: "Rename Error", description: "Failed to rename chat session.", variant: "destructive" });
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await aiService.deleteChatSession(sessionId);
      const remaining = sessions.filter((s) => s._id !== sessionId);
      setSessions(remaining);
      setMenuOpenId(null);
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0]._id);
          setMessages(remaining[0].messages || []);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
      toast({ title: "Chat Deleted", description: "Chat session removed." });
    } catch (_) {
      toast({ title: "Delete Error", description: "Failed to delete chat session.", variant: "destructive" });
    }
  };

  const activeSession = sessions.find((s) => s._id === activeSessionId);

  return (
    <div className="flex h-[620px] max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xl animate-in fade-in duration-300">
      {/* Left Sidebar (Chat History) */}
      <div
        className={`w-64 sm:w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-ml-64 sm:-ml-72"
          }`}
      >
        {/* Sidebar Header with New Chat Button */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 active:scale-98"
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs px-4">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
              No past conversations. Click "+ New Chat" to start.
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s._id === activeSessionId;
              return (
                <div
                  key={s._id}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${isActive
                      ? "bg-slate-800 text-white font-semibold shadow-xs"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    }`}
                  onClick={() => setActiveSessionId(s._id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <MessageSquare size={15} className={isActive ? "text-blue-400 shrink-0" : "shrink-0"} />
                    {editingTitleId === s._id ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingTitleText}
                        onChange={(e) => setEditingTitleText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRenameSession(s._id)}
                        onBlur={() => handleRenameSession(s._id)}
                        className="bg-slate-950 text-white text-xs px-2 py-1 rounded border border-slate-700 outline-none w-full"
                      />
                    ) : (
                      <span className="truncate">{s.title || "Untitled Chat"}</span>
                    )}
                  </div>

                  {/* Options Menu Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === s._id ? null : s._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-opacity"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {/* Context Dropdown Menu */}
                  {menuOpenId === s._id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 top-8 z-30 w-36 bg-slate-950 border border-slate-800 rounded-xl shadow-xl py-1 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <button
                        onClick={() => {
                          setEditingTitleId(s._id);
                          setEditingTitleText(s.title);
                          setMenuOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-800 text-left"
                      >
                        <Edit3 size={13} />
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSession(s._id)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-950/50 text-red-400 text-left"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Panel (ChatGPT Conversation Window) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
            </button>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                {activeSession?.title || "AI Study Buddy"}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Context Grounded ·{" "}
                {selectedFileIds.length > 0 ? `${selectedFileIds.length} Selected Notes` : "Subject Notes"}
              </p>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="sm:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
          >
            <Plus size={14} /> New
          </button>
        </div>

        {/* Message Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 mb-4">
                <Sparkles size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                What would you like to learn today?
              </h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                Ask open-ended questions, request code snippets, or get study summaries grounded in your notes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl w-full">
                {PROMPT_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="p-3 text-left rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {chip}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${m.role === "user"
                      ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                    }`}
                >
                  {m.role === "user" ? <User size={15} /> : <Sparkles size={15} />}
                </div>
                <div className={`max-w-[85%] sm:max-w-[78%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`px-4 py-3 rounded-2xl ${m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-xs shadow-md shadow-blue-500/10 text-xs sm:text-sm leading-relaxed"
                        : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 rounded-tl-xs shadow-xs"
                      }`}
                  >
                    {m.role === "user" ? m.text : <MarkdownText content={m.text} />}
                  </div>
                  {m.timestamp && <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>}
                </div>
              </div>
            ))
          )}

          {typing && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles size={15} />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask anything, request code snippets, or discuss course topics…"
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || typing}
              className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20 shrink-0"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
