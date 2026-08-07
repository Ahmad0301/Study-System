"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Layers, CheckCircle2, RefreshCw, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { aiService } from "@/lib/services/aiService";

interface FlashcardsTabProps {
  subjectId?: string;
  selectedFileIds?: string[];
  triggerKey?: number;
}

export default function FlashcardsTab({
  subjectId,
  selectedFileIds = [],
  triggerKey = 0,
}: FlashcardsTabProps) {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [retryCount, setRetryCount] = useState(0);

  const safeFileIds: string[] = Array.isArray(selectedFileIds) ? selectedFileIds : [];
  const fileIdsKey = safeFileIds.join(",");

  useEffect(() => {
    if (!subjectId) return;

    let isMounted = true;
    async function fetchFlashcards() {
      setLoading(true);
      setError(null);
      try {
        const forceRefresh = triggerKey > 0 || retryCount > 0;
        const res = await aiService.generateFlashcards({
          subjectId: subjectId!,
          fileIds: safeFileIds,
          forceRefresh,
        });
        if (isMounted) {
          setFlashcards(res || []);
          setIndex(0);
          setFlipped(false);
          setKnown(new Set());
        }
      } catch (err: any) {
        if (isMounted) {
          const msg = err?.message || "Failed to generate flashcards";
          setError(msg.includes("Could not extract")
            ? msg
            : msg.includes("No materials")
              ? "No course materials found. Please upload a PDF, DOCX, or TXT file first."
              : msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFlashcards();

    return () => {
      isMounted = false;
    };
  }, [subjectId, fileIdsKey, triggerKey, retryCount]);

  const handleRetry = () => {
    setFlashcards([]);
    setError(null);
    setRetryCount((c) => c + 1);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-4">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
            <Loader2 size={32} className="text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Generating Flashcards…</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Extracting content from {safeFileIds.length} file(s) and creating study cards
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl text-center space-y-4">
        <AlertCircle size={36} className="text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-red-700 dark:text-red-300">Generation Failed</h3>
        <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <RefreshCw size={14} />
          Try Again
        </button>
      </div>
    );
  }

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-3 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <Sparkles size={36} className="text-blue-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Flashcards Ready</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select course materials above and click &quot;Generate AI Content&quot; to generate 3D flashcards.
        </p>
      </div>
    );
  }

  const card = flashcards[index];
  const total = flashcards.length;

  const next = () => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => (i + 1) % total), 150);
  };

  const prev = () => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => (i - 1 + total) % total), 150);
  };

  const toggleKnown = () => {
    const cardId = card.id || `fc-${index}`;
    setKnown((p) => {
      const n = new Set(p);
      if (n.has(cardId)) n.delete(cardId);
      else n.add(cardId);
      return n;
    });
  };

  const cardId = card.id || `fc-${index}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Header & Progress */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
            {index + 1}/{total}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">AI Study Flashcards</p>
            <p className="text-[11px] text-slate-400">Click card to reveal answer</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
            {known.size} Mastered
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800">
            {total - known.size} Review
          </span>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000">
        <div
          className={`card-flip relative w-full h-80 cursor-pointer select-none ${flipped ? "flipped" : ""}`}
          onClick={() => setFlipped(!flipped)}
        >
          {/* Front Card */}
          <div className="backface-hidden absolute inset-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col items-center justify-center p-8 text-center transition-all hover:border-blue-300">
            <span className="absolute top-5 left-5 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-md uppercase tracking-wider">
              Question #{index + 1}
            </span>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
              <Layers size={24} />
            </div>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed max-w-md">
              {card.front}
            </p>
            <p className="absolute bottom-4 text-xs font-semibold text-slate-400 flex items-center gap-1">
              <RefreshCw size={13} /> Click card to flip
            </p>
          </div>

          {/* Back Card */}
          <div className="backface-hidden rotate-y-180 absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 text-center text-white">
            <span className="absolute top-5 left-5 text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-md uppercase tracking-wider text-blue-100">
              Answer Reveal
            </span>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
              <RotateCcw size={24} className="text-white" />
            </div>
            <p className="text-base sm:text-lg font-bold leading-relaxed max-w-md">
              {card.back}
            </p>
            <p className="absolute bottom-4 text-xs text-blue-200">Click to flip back</p>
          </div>
        </div>
      </div>

      {/* Action Controls Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prev}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          title="Previous Card"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={toggleKnown}
          className={`flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md ${known.has(cardId)
              ? "bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700"
              : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
            }`}
        >
          <CheckCircle2 size={16} />
          <span>{known.has(cardId) ? "Mastered Concept!" : "Mark as Mastered"}</span>
        </button>

        <button
          onClick={next}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          title="Next Card"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
