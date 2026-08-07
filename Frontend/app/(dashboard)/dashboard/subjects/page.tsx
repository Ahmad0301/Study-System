"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  FileText,
  Loader2,
  X,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  Sparkles,
  ChevronRight,
  FolderPlus,
} from "lucide-react";

import { subjectService } from "@/lib/services/subjectService";
import { EmptyState } from "@/components/ui/EmptyState";

const DEFAULT_COLOR = "#2563EB";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    subjectService.getAll().then((data) => {
      if (isMounted && data) setSubjects(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Subject name is required.";
    else if (form.name.trim().length < 2)
      e.name = "Name must be at least 2 characters.";
    if (!form.description.trim()) e.description = "Description is required.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      if (editingId) {
        const updated = await subjectService.update(editingId, {
          name: form.name.trim(),
          description: form.description.trim(),
          color: DEFAULT_COLOR,
        });
        setSubjects((p) =>
          p.map((s) => (s.id === editingId ? { ...s, ...updated, color: DEFAULT_COLOR } : s)),
        );
      } else {
        const created = await subjectService.create({
          name: form.name.trim(),
          description: form.description.trim(),
          color: "#2563EB",
          filesCount: selectedFile ? 1 : 0,
          createdAt: new Date().toISOString(),
          progress: 0,
        });
        if (selectedFile && created?.id) {
          await subjectService.uploadFile(created.id, selectedFile);
        }
        const freshSubjects = await subjectService.getAll();
        setSubjects(freshSubjects);
      }
      setModalOpen(false);
      setEditingId(null);
      setSelectedFile(null);
      setForm({ name: "", description: "" });
    } catch (err: any) {
      setErrors({ form: err.message || "Failed to save subject." });
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "", form: "" }));
  };

  const handleEdit = (
    e: React.MouseEvent,
    subject: (typeof subjects)[number],
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(subject.id);
    setForm({ name: subject.name, description: subject.description });
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await subjectService.delete(deleteId);
      setSubjects((p) => p.filter((s) => s.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            My Subjects
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize study materials, lecture slides, and AI tools per subject.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ name: "", description: "" });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus size={16} /> Create Subject
        </button>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Filter subjects by name or topic…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      </div>

      {/* Subjects Grid or Empty State */}
      {filteredSubjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Subjects Found"
          description={searchQuery ? `No subjects match "${searchQuery}". Try a different search term.` : "You haven't added any subjects yet. Create your first subject to start uploading study notes."}
          actionLabel={searchQuery ? undefined : "Create First Subject"}
          onAction={searchQuery ? undefined : () => {
            setEditingId(null);
            setForm({ name: "", description: "" });
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/subjects/${s.id}`}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Header Icon + Action Pills */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${s.color || "#2563EB"}15` }}
                  >
                    <BookOpen size={22} style={{ color: s.color || "#2563EB" }} />
                  </div>

                  {/* Edit / Delete Pills */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEdit(e, s)}
                      title="Edit subject"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteId(s.id);
                      }}
                      title="Delete subject"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {s.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-6">
                  {s.description}
                </p>
              </div>

              {/* Progress & File Count Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
                    <FileText size={14} className="text-slate-400" /> {s.filesCount} materials
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {s.progress}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${s.progress}%`,
                      backgroundColor: s.color || "#2563EB",
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}

          {/* Add Subject Card Shortcut */}
          <button
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", description: "" });
              setModalOpen(true);
            }}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all min-h-[220px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <FolderPlus size={22} />
            </div>
            <p className="text-sm font-bold">Add Subject</p>
          </button>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BookOpen size={18} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {editingId ? "Edit Subject" : "Create New Subject"}
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
              {errors.form && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={16} />
                  <span>{errors.form}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                 Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Physics 101"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all ${
                    errors.name
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs font-medium text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Brief summary of topics covered in this subject…"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all resize-none ${
                    errors.description
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* File Upload (Replaces Theme Accent Color) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Attach Study Material (Optional)
                </label>
                {!selectedFile ? (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-all text-center">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5">
                      <FolderPlus size={16} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Click to upload file</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX up to 20MB</p>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{selectedFile.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      title="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingId(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? "Saving…" : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 p-6 text-center animate-in zoom-in-95 duration-200 space-y-4">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-red-50/50 dark:ring-red-950/20">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete Subject?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                This will permanently delete this subject and all associated study materials. This action cannot be undone.
              </p>
            </div> 
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

