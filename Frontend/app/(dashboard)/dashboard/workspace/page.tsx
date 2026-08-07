"use client";

import { useState, useEffect } from "react";
import { FileText, Sparkles, Layers, HelpCircle, ChevronDown, Check, Loader2, FolderOpen } from "lucide-react";
import SummaryTab from "@/components/workspace/SummaryTab";
import ChatTab from "@/components/workspace/ChatTab";
import FlashcardsTab from "@/components/workspace/FlashcardsTab";
import QuizTab from "@/components/workspace/QuizTab";
import { subjectService } from "@/lib/services/subjectService";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { id: "summary", label: "Executive Summary", icon: FileText, badge: "AI" },
  { id: "chat", label: "AI Study Chat", icon: Sparkles, badge: "Live" },
  { id: "flashcards", label: "3D Flashcards", icon: Layers, badge: "Practice" },
  { id: "quiz", label: "Interactive Quiz", icon: HelpCircle, badge: "Test" },
];

export default function WorkspacePage() {
  const [active, setActive] = useState("summary");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [currentMaterials, setCurrentMaterials] = useState<any[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [triggerKey, setTriggerKey] = useState<number>(0);
  const { toast } = useToast();

  // Load subjects on mount
  useEffect(() => {
    async function loadSubjects() {
      setIsLoadingSubjects(true);
      try {
        const list = await subjectService.getAll();
        setSubjects(list);
        if (list.length > 0) {
          setSelectedSubjectId(list[0].id);
        }
      } catch (err: any) {
        toast({
          title: "Error loading subjects",
          description: err?.message || "Failed to fetch subjects",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, []);

  // Load materials when selectedSubjectId changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setCurrentMaterials([]);
      setSelectedFileIds([]);
      return;
    }

    async function loadMaterials() {
      setIsLoadingMaterials(true);
      setSelectedFileIds([]);
      try {
        const detail = await subjectService.getById(selectedSubjectId);
        if (detail && Array.isArray(detail.materials)) {
          setCurrentMaterials(detail.materials);
          // Auto-select ALL files when subject loads so user can generate immediately
          setSelectedFileIds(detail.materials.map((m: any) => m.id));
        } else {
          setCurrentMaterials([]);
        }
      } catch (err: any) {
        console.error("Failed to load materials for subject:", err);
        setCurrentMaterials([]);
      } finally {
        setIsLoadingMaterials(false);
      }
    }
    loadMaterials();
  }, [selectedSubjectId]);

  const toggleFileSelect = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.length === currentMaterials.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(currentMaterials.map((m: any) => m.id));
    }
  };

  const handleGenerateAI = () => {
    if (selectedFileIds.length === 0) {
      toast({
        title: "No Materials Selected",
        description: "Please select at least one course material to analyze.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    setTriggerKey((prev) => prev + 1);
    setTimeout(() => {
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          AI Study Workspace
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Select course materials to generate executive summaries, practice 3D flashcards, and take quizzes.
        </p>
      </div>

      {/* Subject & Multi-PDF Material Selection Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl space-y-4">
        {/* Top Controls: Subject Selector + Generate Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
              <FolderOpen size={20} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                Active Course Subject
              </label>
              <div className="relative">
                {isLoadingSubjects ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                    <Loader2 size={14} className="animate-spin" /> Loading subjects...
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="pl-3 pr-8 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer border border-slate-200/60 dark:border-slate-700/60 appearance-none"
                    >
                      {subjects.length === 0 && <option value="">No subjects found</option>}
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Generate AI Insights Action Button */}
          <button
            onClick={handleGenerateAI}
            disabled={selectedFileIds.length === 0 || isGenerating}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing Materials…</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate AI Content ({selectedFileIds.length} Files Selected)</span>
              </>
            )}
          </button>
        </div>

        {/* Multi-PDF Material Selection Chips Section */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select PDFs / Materials to Analyze:
            </span>
            {currentMaterials.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {selectedFileIds.length === currentMaterials.length ? "Deselect All" : "Select All Files"}
              </button>
            )}
          </div>

          {isLoadingMaterials ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <Loader2 size={14} className="animate-spin" /> Loading course materials...
            </div>
          ) : currentMaterials.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1">
              No materials uploaded for this subject yet. Upload files from the Subjects page to generate AI insights.
            </p>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {currentMaterials.map((file: any) => {
                const isSelected = selectedFileIds.includes(file.id);
                return (
                  <button
                    key={file.id}
                    onClick={() => toggleFileSelect(file.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <FileText size={14} className={isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-400"} />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Tabs Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xl">
        {/* Segmented Tab Bar */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/40 p-2 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md border border-slate-200/60 dark:border-slate-800"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400"
                      : "bg-slate-200/60 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Body View Container */}
        <div className="p-6 sm:p-8 bg-slate-50/40 dark:bg-slate-950/20 min-h-[560px]">
          {active === "summary" && (
            <SummaryTab
              subjectId={selectedSubjectId}
              selectedFileIds={selectedFileIds}
              triggerKey={triggerKey}
            />
          )}
          {active === "chat" && (
            <ChatTab
              subjectId={selectedSubjectId}
              selectedFileIds={selectedFileIds}
            />
          )}
          {active === "flashcards" && (
            <FlashcardsTab
              subjectId={selectedSubjectId}
              selectedFileIds={selectedFileIds}
              triggerKey={triggerKey}
            />
          )}
          {active === "quiz" && (
            <QuizTab
              subjectId={selectedSubjectId}
              selectedFileIds={selectedFileIds}
              triggerKey={triggerKey}
            />
          )}
        </div>
      </div>
    </div>
  );
}
