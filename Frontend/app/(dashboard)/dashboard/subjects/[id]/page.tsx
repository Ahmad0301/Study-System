"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  UploadCloud,
  Trash2,
  Loader2,
  Sparkles,
  BookOpen,
  Download,
  Eye,
  Search,
  Grid,
  List,
  Filter,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { subjectService } from "@/lib/services/subjectService";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlobalPageLoader } from "@/components/ui/GlobalPageLoader";

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const cachedSubject = id ? subjectService.getCachedById(id) : null;
  const [subject, setSubject] = useState<any>(cachedSubject);
  const [materials, setMaterials] = useState<any[]>(cachedSubject?.materials || []);
  const [loading, setLoading] = useState(!cachedSubject);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "pdf" | "docx">("all");
  const [replaceModal, setReplaceModal] = useState<{
    file: File;
    existingId: string;
    remainingFiles: File[];
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      const cached = subjectService.getCachedById(id);
      if (cached) {
        setSubject(cached);
        setMaterials(cached.materials || []);
        setLoading(false);
      } else {
        setSubject(null);
        setMaterials([]);
        setLoading(true);
      }

      subjectService.getById(id).then((res) => {
        if (isMounted && res) {
          setSubject(res);
          setMaterials(res.materials || []);
        }
      }).finally(() => {
        if (isMounted) setLoading(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Preview Modal state
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewPage, setPreviewPage] = useState(1);
  const [docxHtml, setDocxHtml] = useState<string>("");
  const [loadingDocx, setLoadingDocx] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const isDocx = previewFile?.name?.toLowerCase().endsWith(".docx") ||
      previewFile?.name?.toLowerCase().endsWith(".doc") ||
      previewFile?.type === "docx";

    if (previewFile && isDocx) {
      setLoadingDocx(true);
      setDocxHtml("");
      const rawUrl = previewFile.fileUrl || "";
      const fileUrl = rawUrl.startsWith("http")
        ? rawUrl
        : `http://localhost:3001${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;

      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

      fetch(fileUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then(async (arrayBuffer) => {
          try {
            const mammoth = await import("mammoth");
            const result = await mammoth.convertToHtml({ arrayBuffer });
            if (isMounted) {
              setDocxHtml(
                result.value ||
                "<p className='text-slate-400 italic'>Document text is empty.</p>"
              );
            }
          } catch (mErr: any) {
            if (isMounted) {
              setDocxHtml("<p className='text-red-500 font-medium'>Error converting Word formatting.</p>");
            }
          }
        })
        .catch((err: any) => {
          if (isMounted) {
            setDocxHtml(`<p className="text-red-500 font-medium">Error loading document text: ${err.message}</p>`);
          }
        })
        .finally(() => {
          if (isMounted) setLoadingDocx(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [previewFile]);

  const inputRef = useRef<HTMLInputElement>(null);

  const processFileUploads = useCallback(
    async (fileList: File[]) => {
      if (!fileList || fileList.length === 0) return;

      // Check if any file in fileList has a duplicate name in existing materials
      const duplicateIndex = fileList.findIndex((f) =>
        materials.some((m) => m.name.toLowerCase() === f.name.toLowerCase())
      );

      if (duplicateIndex !== -1) {
        const duplicateFile = fileList[duplicateIndex];
        const existing = materials.find(
          (m) => m.name.toLowerCase() === duplicateFile.name.toLowerCase()
        );
        const remaining = fileList.filter((_, i) => i !== duplicateIndex);

        setReplaceModal({
          file: duplicateFile,
          existingId: existing.id,
          remainingFiles: remaining,
        });
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const totalFiles = fileList.length;
        const progressMap: Record<number, number> = {};

        const uploaded = await Promise.all(
          fileList.map((f, index) =>
            subjectService.uploadFile(id, f, (percent: number) => {
              progressMap[index] = percent;
              const sum = Object.values(progressMap).reduce((a, b) => a + b, 0);
              const overall = Math.round(sum / totalFiles);
              setUploadProgress(overall);
            })
          )
        );
        setMaterials((p) => [
          ...uploaded,
          ...p.filter((m) => !uploaded.some((u) => u.id === m.id)),
        ]);
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [id, materials]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      processFileUploads(Array.from(files));
    },
    [processFileUploads]
  );

  const handleConfirmReplace = async () => {
    if (!replaceModal) return;
    const { file, existingId, remainingFiles } = replaceModal;
    setReplaceModal(null);
    setUploading(true);

    try {
      await subjectService.deleteFile(id, existingId);
      setMaterials((prev) => prev.filter((m) => m.id !== existingId));

      const uploaded = await subjectService.uploadFile(id, file);
      setMaterials((prev) => [uploaded, ...prev]);

      if (remainingFiles.length > 0) {
        await processFileUploads(remainingFiles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCancelReplace = () => {
    if (!replaceModal) return;
    const { remainingFiles } = replaceModal;
    setReplaceModal(null);

    if (remainingFiles.length > 0) {
      processFileUploads(remainingFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (fileId: string) => {
    try {
      await subjectService.deleteFile(id, fileId);
      setMaterials((p) => p.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    e.stopPropagation();
    const fileUrl = file.fileUrl ? `http://localhost:3001${file.fileUrl}` : null;
    if (!fileUrl) return;

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name || "downloaded-file.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      window.open(fileUrl, "_blank");
    }
  };

  // Filtered materials
  const filteredMaterials = materials.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || file.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading || !subject || subject.id !== id) {
    return <GlobalPageLoader message="Loading subject details…" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-0">
        <Link
          href="/dashboard/subjects"
          className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0"
        >
          <ArrowLeft size={14} /> My Subjects
        </Link>
        <span className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
        <span className="text-slate-900 dark:text-slate-100 truncate max-w-xs sm:max-w-md">{subject.name}</span>
      </div>

      {/* Subject Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-2xl pointer-events-none"
          style={{ backgroundColor: subject.color || "#2563EB" }}
        />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm mt-0.5"
              style={{ backgroundColor: `${subject.color || "#2563EB"}15` }}
            >
              <BookOpen size={28} style={{ color: subject.color || "#2563EB" }} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight break-words">
                {subject.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 whitespace-pre-line break-words max-w-2xl leading-relaxed">
                {subject.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} /> {materials.length} uploaded materials
                </span>
                <span>
                  Created{" "}
                  {new Date(subject.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/dashboard/workspace?subjectId=${id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] shrink-0 self-start md:self-center"
          >
            <Sparkles size={16} /> Open in AI Workspace
          </Link>
        </div>
      </div>

      {/* Drag & Drop Upload Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all ${isDragging
          ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]"
          : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 bg-white dark:bg-slate-900"
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isDragging
              ? "bg-blue-600 text-white scale-110"
              : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
              } ${uploading ? "animate-pulse" : ""}`}
          >
            {uploading ? (
              <Loader2 size={26} className="animate-spin" />
            ) : (
              <UploadCloud size={26} />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {uploading
                ? "Uploading materials…"
                : isDragging
                  ? "Drop your study files here"
                  : "Drag & drop lecture notes or slides here"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {uploading
                ? "Analyzing document structure"
                : "Supports PDF, DOCX up to 20MB"}
            </p>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="w-full max-w-xs mt-2 space-y-1">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">{uploadProgress}% Uploading...</p>
            </div>
          )}
        </div>
      </div>

      {/* Course Materials Toolbar & List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Header Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Course Materials
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {filteredMaterials.length} files
            </span>
          </div>

          {/* Controls: Search, Type Filter & View Mode Toggle */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search files…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-200/60 dark:border-slate-700/60"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${typeFilter === "all" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter("pdf")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${typeFilter === "pdf" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
              >
                PDF
              </button>
              <button
                onClick={() => setTypeFilter("docx")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${typeFilter === "docx" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs" : "hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
              >
                DOCX
              </button>
            </div>
          </div>
        </div>

        {/* Content Body — Exclusively List View */}
        {filteredMaterials.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={searchQuery ? "No Files Match Search" : "No Materials Uploaded Yet"}
            description={
              searchQuery
                ? `No documents match "${searchQuery}". Try a different keyword.`
                : "Drag & drop your course PDFs or lecture slides above to start learning with AI."
            }
          />
        ) : (
          /* List View Table */
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredMaterials.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                onClick={() => setPreviewFile(file)}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${file.type === "pdf"
                    ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                    : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                    }`}
                >
                  {file.type === "pdf" ? <FileText size={18} /> : <FileSpreadsheet size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {file.size} · Uploaded {file.uploadedAt}
                  </p>
                </div>

                <div
                  className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Preview Document"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={(e) => handleDownload(e, file)}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Download File"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duplicate File Replace Confirmation Modal */}
      {replaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCancelReplace}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 p-6 text-center animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-amber-50/50 dark:ring-amber-950/20">
              <UploadCloud size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Replace Existing File?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                A file named <span className="font-bold text-slate-800 dark:text-slate-200">"{replaceModal.file.name}"</span> already exists in this subject. Replacing it will overwrite the previous document.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancelReplace}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReplace}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20"
              >
                Replace File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Document Preview Placeholder Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPreviewFile(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${previewFile.type === "pdf"
                    ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                    : "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                    }`}
                >
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {previewFile.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">Document Preview · {previewFile.name}</p>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleDownload(e, previewFile)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Actual Document Viewer Body */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-auto flex items-start justify-center">
              {previewFile.fileUrl ? (
                previewFile.name?.toLowerCase().endsWith(".pdf") || previewFile.type === "pdf" ? (
                  <iframe
                    key={`${previewFile.id || previewFile.fileUrl}-${previewPage}`}
                    src={`http://localhost:3001${previewFile.fileUrl}#page=${previewPage}`}
                    className="w-full h-full rounded-2xl bg-white border border-slate-200 dark:border-slate-800 shadow-xl"
                    title={previewFile.name}
                  />
                ) : (
                  <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 sm:p-12 my-auto min-h-[500px]">
                    {loadingDocx ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={32} className="animate-spin text-blue-600" />
                        <p className="text-xs font-semibold text-slate-500">Reading Word document text…</p>
                      </div>
                    ) : (
                      <div
                        className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed space-y-4"
                        dangerouslySetInnerHTML={{ __html: docxHtml }}
                      />
                    )}
                  </div>
                )
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <FileText size={48} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-semibold">Preview unavailable for this file.</p>
                </div>
              )}
            </div>

            {/* Document Footer Pagination Toolbar */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
              {previewFile.name?.toLowerCase().endsWith(".pdf") || previewFile.type === "pdf" ? (
                <div className="flex items-center gap-2">
                  <button
                    disabled={previewPage <= 1}
                    onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                    title="Previous Page"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Page {previewPage}</span>
                  <button
                    onClick={() => setPreviewPage((p) => p + 1)}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                    title="Next Page"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-400">
                  <FileText size={14} className="text-blue-500" />
                  <span>Full Word Document View</span>
                </div>
              )}

              <Link
                href={`/dashboard/workspace?subjectId=${id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
              >
                <Sparkles size={13} /> Summarize in AI Workspace
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


