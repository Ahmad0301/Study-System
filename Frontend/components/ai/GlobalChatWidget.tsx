"use client";

import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  Send,
  X,
  Trash2,
  Loader2,
  ChevronDown,
  RefreshCw,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Code,
  BookOpen,
  Copy,
  Check,
  History,
  Clock,
  Search,
  ArrowLeft,
} from "lucide-react";
import { subjectService } from "@/lib/services/subjectService";
import { ProjectLogoIcon } from "@/components/AppLogo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "assistant";
  text: string;
  timestamp: string;
}

const STARTER_PROMPTS = [
  { label: "Explain a Complex Concept", icon: Lightbulb, prompt: "Can you explain Quantum Physics in simple terms?" },
  { label: "Help with Homework", icon: HelpCircle, prompt: "How do I structure a persuasive research paper essay?" },
  { label: "Coding Assistant", icon: Code, prompt: "Explain binary search tree algorithms with code examples." },
  { label: "Study Hacks", icon: BookOpen, prompt: "What are the best scientifically proven study strategies for exams?" },
];

function parseFollowUpQuestions(text: string): { mainText: string; questions: string[] } {
  const followUpMatch = text.match(/###?\s*(?:💡\s*)?(?:Suggested\s+)?Follow-up\s+Questions:?([\s\S]*)$/i);
  if (!followUpMatch) return { mainText: text, questions: [] };

  const mainText = text.slice(0, followUpMatch.index).trim();
  const rawQuestionsBlock = followUpMatch[1];
  const questions = rawQuestionsBlock
    .split(/\n/)
    .map((line) => line.replace(/^[\-\*\d\.]+\s*/, "").trim())
    .filter((q) => q.length > 5 && q.endsWith("?"));

  return { mainText, questions };
}

function AiMessageContent({ text, onSelectPrompt }: { text: string; onSelectPrompt?: (prompt: string) => void }) {
  const { mainText, questions } = parseFollowUpQuestions(text);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyCode = (codeText: string, idx: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const parts = mainText.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 text-xs leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const content = part.slice(3, -3).trim();
          const firstLineEnd = content.indexOf("\n");
          let lang = "code";
          let codeText = content;
          if (firstLineEnd !== -1) {
            const possibleLang = content.slice(0, firstLineEnd).trim();
            if (/^[a-zA-Z0-9_-]+$/.test(possibleLang)) {
              lang = possibleLang;
              codeText = content.slice(firstLineEnd + 1);
            }
          }

          return (
            <div
              key={index}
              className="my-2.5 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 font-mono text-[11px] shadow-md"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400">
                <span className="font-bold uppercase tracking-wider text-blue-400">{lang}</span>
                <button
                  type="button"
                  onClick={() => copyCode(codeText, index)}
                  className="flex items-center gap-1 hover:text-white transition-colors text-[10px] font-sans px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  {copiedIdx === index ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-slate-200 leading-relaxed font-mono whitespace-pre">
                {codeText}
              </pre>
            </div>
          );
        }

        return <RenderFormattedBlocks key={index} text={part} />;
      })}

      {questions.length > 0 && (
        <div className="pt-2.5 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Lightbulb size={12} className="text-amber-500" /> Suggested Follow-ups
          </p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, qIdx) => (
              <button
                key={qIdx}
                type="button"
                onClick={() => onSelectPrompt && onSelectPrompt(q)}
                className="text-left text-[11px] font-medium px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 hover:bg-blue-100 dark:hover:bg-blue-900 transition-all hover:scale-[1.01] active:scale-95"
              >
                💡 {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RenderFormattedBlocks({ text }: { text: string }) {
  if (!text.trim()) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let tableRows: string[] = [];
  let inTable = false;

  const flushTable = (key: number) => {
    if (tableRows.length > 0) {
      elements.push(<RenderMarkdownTable key={`table-${key}`} rows={tableRows} />);
      tableRows = [];
    }
    inTable = false;
  };

  lines.forEach((line, idx) => {
    let trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      tableRows.push(trimmed);
      return;
    } else if (inTable) {
      flushTable(idx);
    }

    if (!trimmed) {
      elements.push(<div key={`empty-${idx}`} className="h-1.5" />);
      return;
    }

    // Horizontal Rule: --- or *** or ___
    if (/^[\-\*\_]{3,}$/.test(trimmed)) {
      elements.push(
        <hr key={idx} className="my-2.5 border-t border-slate-200 dark:border-slate-800" />
      );
      return;
    }

    // Heading detection: match 1 to 6 leading # symbols
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const titleText = headingMatch[2];

      if (level === 1) {
        elements.push(
          <h2 key={idx} className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base mt-3 mb-1">
            {formatInline(titleText)}
          </h2>
        );
      } else if (level === 2) {
        elements.push(
          <h3 key={idx} className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm mt-3 mb-1">
            {formatInline(titleText)}
          </h3>
        );
      } else {
        elements.push(
          <h4 key={idx} className="font-bold text-slate-900 dark:text-slate-100 text-[11px] sm:text-xs mt-2.5 mb-0.5">
            {formatInline(titleText)}
          </h4>
        );
      }
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={idx} className="border-l-3 border-blue-500 pl-3 py-1 my-1.5 bg-blue-50/50 dark:bg-blue-950/30 text-slate-700 dark:text-slate-300 italic text-[11px] rounded-r-lg">
          {formatInline(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Unordered List: - or * or +
    if (/^[\-\*\+]\s+/.test(trimmed)) {
      const listContent = trimmed.replace(/^[\-\*\+]\s+/, "");
      elements.push(
        <div key={idx} className="flex items-start gap-2 ml-1 my-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
          <span>{formatInline(listContent)}</span>
        </div>
      );
      return;
    }

    // Ordered List: 1. 2. 3.
    const orderedMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
    if (orderedMatch) {
      const num = orderedMatch[1];
      const listContent = orderedMatch[2];
      elements.push(
        <div key={idx} className="flex items-start gap-2 ml-1 my-0.5">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0 font-mono">{num}.</span>
          <span>{formatInline(listContent)}</span>
        </div>
      );
      return;
    }

    // Paragraph fallback — strip any stray leading hashes or horizontal rules
    const cleanLine = trimmed.replace(/^#{1,6}\s*/, "").replace(/^[\-\*\_]{3,}\s*/, "");
    elements.push(
      <p key={idx} className="my-0.5">
        {formatInline(cleanLine)}
      </p>
    );
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return <>{elements}</>;
}

function RenderMarkdownTable({ rows }: { rows: string[] }) {
  if (rows.length < 2) return null;

  const contentRows = rows.filter((r) => !/^\|[\s\:\-]*\|/.test(r.replace(/\s+/g, "")));
  if (contentRows.length === 0) return null;

  const headerCells = contentRows[0]
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
  const bodyRows = contentRows.slice(1).map((row) =>
    row
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim())
  );

  return (
    <div className="my-2.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <table className="w-full text-left text-[11px] border-collapse">
        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-800">
          <tr>
            {headerCells.map((h, i) => (
              <th key={i} className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                {formatInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
          {bodyRows.map((r, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              {r.map((cell, cIdx) => (
                <td key={cIdx} className="p-2 border-r border-slate-200 dark:border-slate-800/60 last:border-r-0 text-slate-700 dark:text-slate-300">
                  {formatInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const sanitizedText = text.replace(/^#{1,6}\s*/, "").replace(/^[\-\*\_]{3,}\s*/, "");
  const parts = sanitizedText.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono text-[10px]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function GlobalChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
  const [historySearch, setHistorySearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Fetch chat session history directly from MongoDB when widget opens or mounts
  useEffect(() => {
    let isMounted = true;

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setInitialLoading(false);
      return;
    }

    fetch(`${API_URL}/ai/general-chat`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setInitialLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || loading) return;

    setInput("");

    // Optimistically append user message to UI
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await fetch(`${API_URL}/ai/general-chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else if (data.aiMessage) {
        setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, data.aiMessage]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "ai",
        text: "Sorry, I ran into an error generating a response. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      await fetch(`${API_URL}/ai/general-chat`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button Launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 hover:scale-105 transition-all duration-300 ring-4 ring-blue-500/10"
        >
          <div className="relative flex items-center justify-center">
            <ProjectLogoIcon size={22} variant="white" className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-blue-600 animate-pulse" />
          </div>
          <span className="text-xs tracking-wide">Ask StudyAI</span>
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl w-[92vw] sm:w-[420px] h-[580px] max-h-[82vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 flex items-center justify-center shadow-sm">
                <ProjectLogoIcon size={24} />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                  StudyAI Assistant
                  
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode(viewMode === "chat" ? "history" : "chat")}
                className={`p-2 rounded-xl transition-colors ${
                  viewMode === "history"
                    ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                }`}
                title={viewMode === "history" ? "Back to Chat" : "View Past Chats History"}
              >
                <History size={16} />
              </button>
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  disabled={clearing}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  title="Clear conversation history from database"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                title="Minimize Chat"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
            {viewMode === "history" ? (
              /* Past Chats History View */
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search past chats..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  </div>
                  <button
                    onClick={() => setViewMode("chat")}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0"
                  >
                    <MessageSquare size={13} /> Chat
                  </button>
                </div>

                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <Clock size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
                    <p className="font-semibold">No past chat history found.</p>
                    <p className="text-[11px] text-slate-400">Ask questions in the chat to build your history!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold">
                      <span>{messages.length} total messages in history</span>
                      <button
                        onClick={handleClearHistory}
                        disabled={clearing}
                        className="text-red-500 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 size={12} /> Clear History
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {messages
                        .filter((m) => m.text.toLowerCase().includes(historySearch.toLowerCase()))
                        .map((msg, idx) => {
                          const isUser = msg.role === "user";
                          return (
                            <div
                              key={msg.id || idx}
                              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-bold text-[11px] flex items-center gap-1.5 ${isUser ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                  {isUser ? <MessageSquare size={12} /> : <ProjectLogoIcon size={13} />}
                                  {isUser ? "You" : "StudyAI Assistant"}
                                </span>
                                {msg.timestamp && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] line-clamp-4 font-normal">
                                {msg.text}
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ) : initialLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400 text-xs">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <span>Loading your AI assistant...</span>
              </div>
            ) : messages.length === 0 ? (
              /* Starter Suggestions when no messages exist */
              <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-4 py-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">How can I help you today?</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Ask me anything about your homework, science, coding, literature, or study tips!
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 w-full pt-2">
                  {STARTER_PROMPTS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSend(item.prompt)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all text-left group"
                      >
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.prompt}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Message Thread List */
              messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id || idx}
                    className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs shrink-0 shadow-xs mt-1">
                        <ProjectLogoIcon size={16} />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isUser
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-md shadow-blue-500/10"
                          : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs shadow-xs"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-line">{msg.text}</p>
                      ) : (
                        <AiMessageContent
                          text={msg.text}
                          onSelectPrompt={(promptText) => handleSend(promptText)}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Loader Indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs shrink-0 shadow-xs mt-1">
                  <ProjectLogoIcon size={16} className="animate-pulse" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl rounded-tl-xs p-3.5 text-xs flex items-center gap-1.5 text-slate-400">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Form */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask any general question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all shrink-0"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
