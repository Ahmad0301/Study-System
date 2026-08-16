"use client";

import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Copy, Check, Loader2, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { aiService } from "@/lib/services/aiService";

interface SummaryTabProps {
  subjectId?: string;
  selectedFileIds?: string[];
  triggerKey?: number;
}

export default function SummaryTab({
  subjectId,
  selectedFileIds = [],
  triggerKey = 0,
}: SummaryTabProps) {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const safeFileIds: string[] = Array.isArray(selectedFileIds) ? selectedFileIds : [];
  const fileIdsKey = safeFileIds.join(",");

  useEffect(() => {
    // Only generate summary when subjectId is selected, safeFileIds has files, AND user clicked "Generate AI Content" (triggerKey > 0)
    if (!subjectId || safeFileIds.length === 0 || (triggerKey === 0 && retryCount === 0)) {
      if (triggerKey === 0 && retryCount === 0) {
        setSummaryData(null);
      }
      return;
    }

    let isMounted = true;
    async function fetchSummary() {
      setLoading(true);
      setError(null);
      try {
        const forceRefresh = triggerKey > 0 || retryCount > 0;
        const res = await aiService.generateSummary({
          subjectId: subjectId!,
          fileIds: safeFileIds,
          forceRefresh,
        });
        if (isMounted) {
          setSummaryData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          const msg = err?.message || "Failed to generate AI summary";
          // Surface clear user-friendly messages
          setError(msg.includes("Could not extract")
            ? msg
            : msg.includes("No materials")
              ? "No course materials found. Please upload a PDF, DOCX, or TXT file first."
              : msg.includes("malformed")
                ? "AI returned an unexpected response. Please try generating again."
                : msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSummary();

    return () => {
      isMounted = false;
    };
  }, [subjectId, fileIdsKey, triggerKey, retryCount]);

  const handleRetry = () => {
    setSummaryData(null);
    setError(null);
    setRetryCount((c) => c + 1);
  };

  const handleCopy = () => {
    if (!summaryData) return;
    const text =
      `${summaryData.title || "Summary"} — ${summaryData.subject || ""}\n\n` +
      (summaryData.sections || [])
        .map(
          (s: any) =>
            `${s.heading}:\n` + (s.bullets || []).map((b: string) => `- ${b}`).join("\n")
        )
        .join("\n\n") +
      "\n\nKey Takeaways:\n" +
      (summaryData.keyTakeaways || []).map((t: string) => `- ${t}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
            <Loader2 size={32} className="text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">Analyzing Document…</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Extracting text and generating AI summary from {safeFileIds.length} file(s)
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4" />
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
        <div className="pt-1">
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-3 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <Sparkles size={36} className="text-blue-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Ready to Analyze</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select course materials above and click &quot;Generate AI Content&quot; to produce an executive summary.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Executive Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 text-blue-300">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{summaryData.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {summaryData.subject || "Course Subject"}
              </p>

            </div>
          </div>


        </div>
      </div>

      {/* Structured Sections Grid */}
      <div className="space-y-4">
        {summaryData.sections &&
          summaryData.sections.map((section: any, i: number) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 transition-all"
            >
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3 flex items-center gap-2.5">
                <span className="w-2 h-5 bg-blue-600 rounded-full" />
                {section.heading}
              </h3>
              <ul className="space-y-2.5">
                {section.bullets &&
                  section.bullets.map((b: string, j: number) => (
                    <li key={j} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
      </div>

      {/* Key Takeaways Highlight Box */}
      {summaryData.keyTakeaways && summaryData.keyTakeaways.length > 0 && (
        <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80">
          <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm mb-3 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            Key Exam Takeaways
          </h3>
          <ul className="space-y-2.5">
            {summaryData.keyTakeaways.map((t: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
