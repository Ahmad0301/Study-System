"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  ChevronRight,
  AlertCircle,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { aiService } from "@/lib/services/aiService";

interface QuizTabProps {
  subjectId?: string;
  selectedFileIds?: string[];
  triggerKey?: number;
}

const QUICK_COUNTS = [5, 10, 15, 20, 25];

/**
 * Fisher-Yates shuffle algorithm:
 * Shuffles questions order AND shuffles option positions for each question while preserving the correct answer index mapping.
 */
function shuffleQuestions(questions: any[]): any[] {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  // Deep clone
  const cloned = questions.map((q) => ({
    ...q,
    options: Array.isArray(q.options) ? [...q.options] : [],
  }));

  // Shuffle question order using Fisher-Yates
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }

  // Shuffle options for each question and update correct answer index
  return cloned.map((q) => {
    if (!q.options || q.options.length === 0) return q;

    let cIdx = typeof q.correct === "number" ? q.correct : parseInt(q.correct, 10);
    if (isNaN(cIdx) && typeof q.correct === "string") {
      const charCode = q.correct.trim().toUpperCase().charCodeAt(0);
      if (charCode >= 65 && charCode <= 68) {
        cIdx = charCode - 65;
      } else {
        cIdx = q.options.indexOf(q.correct);
      }
    }
    if (cIdx < 0 || isNaN(cIdx) || cIdx >= q.options.length) cIdx = 0;

    const correctAnswerText = q.options[cIdx];

    const shuffledOptions = [...q.options];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    const newCorrectIndex = shuffledOptions.indexOf(correctAnswerText);

    return {
      ...q,
      options: shuffledOptions,
      correct: newCorrectIndex >= 0 ? newCorrectIndex : 0,
    };
  });
}

export default function QuizTab({
  subjectId,
  selectedFileIds = [],
  triggerKey = 0,
}: QuizTabProps) {
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<number>(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState<boolean>(false);

  const safeFileIds: string[] = Array.isArray(selectedFileIds) ? selectedFileIds : [];
  const fileIdsKey = safeFileIds.join(",");

  const fetchQuiz = useCallback(
    async (count: number, forceRefresh: boolean = true) => {
      if (!subjectId || safeFileIds.length === 0) return;

      setLoading(true);
      setError(null);
      try {
        const clampedCount = Math.min(Math.max(count, 1), 25);
        const res = await aiService.generateQuiz({
          subjectId: subjectId!,
          fileIds: safeFileIds,
          questionCount: clampedCount,
          forceRefresh,
        });

        const rawQuestions = Array.isArray(res) ? res : [];
        // Apply Fisher-Yates shuffle algorithm to ensure fresh questions & option positions
        const randomized = shuffleQuestions(rawQuestions).slice(0, clampedCount);

        setQuizQuestions(randomized);
        setCurrent(0);
        setSelected(null);
        setAnswers({});
        setShowResult(false);
        setIsStarted(true);
      } catch (err: any) {
        setError(err?.message || "Failed to generate quiz questions. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [subjectId, fileIdsKey]
  );

  // Auto trigger if external triggerKey is pressed
  useEffect(() => {
    if (triggerKey > 0 && subjectId) {
      fetchQuiz(questionCount, true);
    }
  }, [triggerKey, subjectId, fetchQuiz, questionCount]);

  const handleStartQuiz = () => {
    fetchQuiz(questionCount, true);
  };

  const handleCountChange = (val: number) => {
    const clamped = Math.min(Math.max(val, 1), 25);
    setQuestionCount(clamped);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 p-4 text-center">
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center">
            <Sparkles className="text-blue-600 dark:text-blue-400 animate-pulse" size={32} />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Generating {questionCount} AI Quiz Questions…
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Extracting content from {safeFileIds.length} file(s) · Creating MCQ + True/False questions
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-3xl text-center space-y-4 shadow-sm">
        <AlertCircle size={36} className="text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-red-700 dark:text-red-300">Generation Failed</h3>
        <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
          {error.includes("Could not extract")
            ? error
            : error.includes("No materials")
              ? "No course materials found. Please upload a PDF, DOCX, or TXT file first."
              : error.includes("malformed")
                ? "AI returned an unexpected response. Please try generating again."
                : error}
        </p>
        <button
          onClick={() => { setIsStarted(false); setError(null); }}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Quiz Setup / Start Screen (Select question count 1 to 25)
  if (!isStarted || quizQuestions.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-6 p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
            <HelpCircle size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            Quiz Generator
          </h2>

        </div>

        {/* Question Count Selector (Max 25) */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Select Number of Questions</span>
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">{questionCount} Questions</span>
          </label>

          {/* Quick Select Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {QUICK_COUNTS.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setQuestionCount(num)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${questionCount === num
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400"
                  }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-[11px] text-slate-400 font-medium">Custom (1 - 25):</span>
            <input
              type="number"
              min={1}
              max={25}
              value={questionCount}
              onChange={(e) => handleCountChange(parseInt(e.target.value, 10) || 1)}
              className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 text-center outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleStartQuiz}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98"
        >
          <span>Generate & Start Quiz</span>
        </button>
      </div>
    );
  }

  const question = quizQuestions[current] || quizQuestions[0];
  if (!question) return null;

  const total = quizQuestions.length;
  const qId = question.id || `q-${current}`;

  // Correct index normalization
  let correctIndex = typeof question.correct === "number" ? question.correct : parseInt(question.correct, 10);
  if (isNaN(correctIndex)) {
    if (typeof question.correct === "string") {
      const charCode = question.correct.trim().toUpperCase().charCodeAt(0);
      if (charCode >= 65 && charCode <= 68) {
        correctIndex = charCode - 65;
      } else {
        correctIndex = (question.options || []).indexOf(question.correct);
      }
    }
    if (correctIndex < 0 || isNaN(correctIndex)) correctIndex = 0;
  }

  const selectOption = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setAnswers((p) => ({ ...p, [qId]: idx }));
  };

  const next = async () => {
    if (current + 1 < total) {
      setCurrent(current + 1);
      setSelected(null);
    } else {
      setShowResult(true);
      if (subjectId) {
        try {
          const finalScore = quizQuestions.filter((q, idx) => {
            const key = q.id || `q-${idx}`;
            let cIdx = typeof q.correct === "number" ? q.correct : parseInt(q.correct, 10);
            if (isNaN(cIdx) && typeof q.correct === "string") {
              const charCode = q.correct.trim().toUpperCase().charCodeAt(0);
              if (charCode >= 65 && charCode <= 68) cIdx = charCode - 65;
              else cIdx = (q.options || []).indexOf(q.correct);
            }
            if (cIdx < 0 || isNaN(cIdx)) cIdx = 0;
            return answers[key] === cIdx;
          }).length;
          const finalPct = Math.round((finalScore / total) * 100);
          await aiService.submitQuizScore({
            subjectId,
            score: finalPct,
            correctCount: finalScore,
            totalQuestions: total,
          });
        } catch (_) { }
      }
    }
  };

  const restart = () => {
    setIsStarted(false);
    setCurrent(0);
    setSelected(null);
    setAnswers({});
    setShowResult(false);
  };

  const score = quizQuestions.filter((q, idx) => {
    const key = q.id || `q-${idx}`;
    let cIdx = typeof q.correct === "number" ? q.correct : parseInt(q.correct, 10);
    if (isNaN(cIdx) && typeof q.correct === "string") {
      const charCode = q.correct.trim().toUpperCase().charCodeAt(0);
      if (charCode >= 65 && charCode <= 68) cIdx = charCode - 65;
      else cIdx = (q.options || []).indexOf(q.correct);
    }
    if (cIdx < 0 || isNaN(cIdx)) cIdx = 0;
    return answers[key] === cIdx;
  }).length;

  const pct = Math.round((score / total) * 100);

  if (showResult) {
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 text-center shadow-2xl">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 ring-8 ${pct >= 70
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-emerald-50/50 dark:ring-emerald-950/20"
                : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-amber-50/50 dark:ring-amber-950/20"
              }`}
          >
            <Trophy size={36} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
            {pct >= 80 ? "Outstanding Mastery!" : pct >= 60 ? "Great Effort!" : "Keep Practicing!"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            You answered {score} out of {total} questions correctly.
          </p>

          <div
            className="text-5xl font-extrabold mb-3 tracking-tight"
            style={{ color: pct >= 70 ? "#059669" : "#D97706" }}
          >
            {pct}%
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                backgroundColor: pct >= 70 ? "#059669" : "#D97706",
              }}
            />
          </div>

          <div className="space-y-2 mb-8 text-left bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto">
            {quizQuestions.map((q, i) => {
              const key = q.id || `q-${i}`;
              let cIdx = typeof q.correct === "number" ? q.correct : parseInt(q.correct, 10);
              if (isNaN(cIdx) && typeof q.correct === "string") {
                const charCode = q.correct.trim().toUpperCase().charCodeAt(0);
                if (charCode >= 65 && charCode <= 68) cIdx = charCode - 65;
                else cIdx = (q.options || []).indexOf(q.correct);
              }
              if (cIdx < 0 || isNaN(cIdx)) cIdx = 0;
              const isUserCorrect = answers[key] === cIdx;

              return (
                <div key={key} className="flex items-center gap-3 text-xs">
                  {isUserCorrect ? (
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-500 shrink-0" />
                  )}
                  <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                    Q{i + 1}. {q.question}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={restart}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} /> Configure New Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Quiz Progress Top Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Question {current + 1} of {total}</span>
          <span className="text-blue-600 dark:text-blue-400">{Math.round(((current + 1) / total) * 100)}% Completed</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
            Q{current + 1}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
            {question.question}
          </h2>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {question.options &&
            question.options.map((opt: string, i: number) => {
              const isSelected = selected === i;
              const isCorrect = i === correctIndex;
              const showState = selected !== null;

              let cls = "border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-950/20";
              if (showState && isCorrect) cls = "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40";
              else if (showState && isSelected && !isCorrect) cls = "border-red-500 bg-red-50/80 dark:bg-red-950/40";
              else if (showState) cls = "border-slate-200/40 dark:border-slate-800/40 opacity-50";

              return (
                <button
                  key={i}
                  onClick={() => selectOption(i)}
                  disabled={selected !== null}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left text-xs sm:text-sm font-medium transition-all ${cls}`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${showState && isCorrect
                        ? "bg-emerald-600 text-white"
                        : showState && isSelected && !isCorrect
                          ? "bg-red-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 text-slate-800 dark:text-slate-200">{opt}</span>
                  {showState && isCorrect && <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />}
                  {showState && isSelected && !isCorrect && <XCircle size={18} className="text-red-500" />}
                </button>
              );
            })}
        </div>

        {/* Feedback Bar & Next Button */}
        {selected !== null && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 animate-in fade-in duration-200">
            <p className={`text-xs font-bold ${selected === correctIndex ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {selected === correctIndex ? "✨ Correct Answer!" : "❌ Incorrect — The correct answer is highlighted."}
            </p>
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20"
            >
              <span>{current + 1 < total ? "Next Question" : "View Results"}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
