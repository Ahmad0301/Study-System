"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Sparkles, Layers, HelpCircle, ChevronDown, Check, Loader2, FolderOpen, BookOpen } from "lucide-react";
import SummaryTab from "@/components/workspace/SummaryTab";
import ChatTab from "@/components/workspace/ChatTab";
import FlashcardsTab from "@/components/workspace/FlashcardsTab";
import QuizTab from "@/components/workspace/QuizTab";
import { subjectService } from "@/lib/services/subjectService";
import { useToast } from "@/hooks/use-toast";
import { GlobalPageLoader } from "@/components/ui/GlobalPageLoader";

const tabs = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "chat", label: "AI Chat", icon: Sparkles },
  { id: "flashcards", label: " Flashcards", icon: Layers },
  { id: "quiz", label: "Take Quiz", icon: HelpCircle },
];

function SubjectDropdown({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  isLoading,
}: {
  subjects: any[];
  selectedSubjectId: string;
  onSelectSubject: (id: string) => void;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
        <Loader2 size={14} className="animate-spin text-blue-600" /> Loading subjects...
      </div>
    );
  }

  return (
    <div className="relative min-w-[240px] sm:min-w-[300px]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-900 dark:text-slate-100 transition-all text-left shadow-xs active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedSubject ? (
            <>
              <div
                className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: selectedSubject.color || "#2563EB" }}
              />
              <span className="truncate">{selectedSubject.name}</span>
            </>
          ) : (
            <span className="text-slate-400 font-medium italic">Select a Subject...</span>
          )}
        </div>
        <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl z-30 py-1.5 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100 dark:divide-slate-800/60">
          <button
            type="button"
            onClick={() => {
              onSelectSubject("");
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
              selectedSubjectId === ""
                ? "bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <span className="italic font-medium">Select a Subject...</span>
            {selectedSubjectId === "" && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
          </button>

          {subjects.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 italic">No subjects available</div>
          ) : (
            subjects.map((s) => {
              const isSelected = s.id === selectedSubjectId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelectSubject(s.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color || "#2563EB" }}
                    />
                    <span className="truncate">{s.name}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function WorkspacePageContent() {
  const searchParams = useSearchParams();
  const paramSubjectId = searchParams.get("subjectId") || searchParams.get("id");

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
        // Only select subject if subjectId query param was explicitly passed (e.g. from Subject Detail page)
        if (paramSubjectId && list.some((s: any) => s.id === paramSubjectId)) {
          setSelectedSubjectId(paramSubjectId);
        } else {
          // Direct navigation to workspace -> Do NOT auto-select any subject
          setSelectedSubjectId("");
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
  }, [paramSubjectId]);

  // Load materials when selectedSubjectId changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setCurrentMaterials([]);
      setSelectedFileIds([]);
      return;
    }

    async function loadMaterials() {
      setIsLoadingMaterials(true);
      // NEVER auto-select materials/files! User selects manually.
      setSelectedFileIds([]);
      try {
        const detail = await subjectService.getById(selectedSubjectId);
        if (detail && Array.isArray(detail.materials)) {
          setCurrentMaterials(detail.materials);
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
    if (!selectedSubjectId) {
      toast({
        title: "No Subject Selected",
        description: "Please select a course subject first.",
        variant: "destructive",
      });
      return;
    }
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

  if (isLoadingSubjects) {
    return <GlobalPageLoader message="Loading AI workspace materials…" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          AI Workspace
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Select course materials to generate executive summaries, practice 3D flashcards, and take quizzes.
        </p>
      </div>

      {/* Subject & Multi-PDF Material Selection Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xl space-y-4">
        {/* Top Controls: Custom Subject Dropdown + Generate Button */}
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
              <SubjectDropdown
                subjects={subjects}
                selectedSubjectId={selectedSubjectId}
                onSelectSubject={(id) => setSelectedSubjectId(id)}
                isLoading={isLoadingSubjects}
              />
            </div>
          </div>

          {/* Generate AI Insights Action Button */}
          <button
            onClick={handleGenerateAI}
            disabled={!selectedSubjectId || selectedFileIds.length === 0 || isGenerating}
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
            {selectedSubjectId && currentMaterials.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                {selectedFileIds.length === currentMaterials.length ? "Deselect All" : "Select All Files"}
              </button>
            )}
          </div>

          {!selectedSubjectId ? (
            <p className="text-xs text-slate-400 italic py-1">
              Please select a course subject above to view its materials.
            </p>
          ) : isLoadingMaterials ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <Loader2 size={14} className="animate-spin text-blue-600" /> Loading course materials...
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

export default function WorkspacePage() {
  return (
    <Suspense fallback={<GlobalPageLoader message="Loading AI workspace..." />}>
      <WorkspacePageContent />
    </Suspense>
  );
}
