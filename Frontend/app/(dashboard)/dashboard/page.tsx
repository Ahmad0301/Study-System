"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Trophy,
  TrendingUp,
  Upload,
  Brain,
  Layers,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import {
  mockWeeklyStudyStats,
} from "@/lib/mockData";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { subjectService } from "@/lib/services/subjectService";

const activityIcons: Record<string, any> = {
  upload: Upload,
  quiz: Trophy,
  flashcard: Layers,
  summary: Sparkles,
  subject: BookOpen,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [liveStats, setLiveStats] = useState({
    totalSubjects: 0,
    subjectsThisMonth: 0,
    uploadedFiles: 0,
    filesThisWeek: 0,
    avgQuizScore: 0,
    completedActivities: 0,
  });
  const [realSubjects, setRealSubjects] = useState<any[]>([]);
  const [realActivities, setRealActivities] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    subjectService.getDashboardStats().then((data) => {
      if (isMounted && data) setLiveStats(data);
    });
    subjectService.getAll().then((data) => {
      if (isMounted && Array.isArray(data)) setRealSubjects(data);
    });
    subjectService.getRecentActivities().then((data) => {
      if (isMounted && Array.isArray(data)) setRealActivities(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      label: "Total Subjects",
      value: liveStats.totalSubjects,
      trend: `${liveStats.totalSubjects} Total Subjects`,
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/50",
    },
    {
      label: "Uploaded Files",
      value: liveStats.uploadedFiles,
      trend: `${liveStats.uploadedFiles} Total Materials`,
      icon: FileText,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      label: "Avg. Quiz Score",
      value: liveStats.avgQuizScore > 0 ? `${liveStats.avgQuizScore}%` : "No Quizzes Yet",
      trend: liveStats.avgQuizScore > 0 ? "Performance" : "Take a Quiz",
      icon: Trophy,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      label: "Activities Done",
      value: liveStats.completedActivities,
      trend: "Activities",
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/50",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.fullName }!
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-lg leading-relaxed">
            You have 3 pending quizzes and 2 new AI summaries ready. Keep up the great streak!
          </p>
        </div>
      </div>



      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon size={20} className={s.color} />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {s.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart & Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Study Activity Recharts Visualization */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Weekly Study Performance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total study hours spent across all subjects</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg">
              <TrendingUp size={14} /> 27.6 hrs total
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockWeeklyStudyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#1E293B",
                    borderRadius: "12px",
                    color: "#F8FAFC",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="hours" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Quick Actions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Fast-track your learning workflow</p>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/dashboard/workspace"
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">Launch AI Workspace</p>
                <p className="text-[11px] text-slate-400 truncate">Summaries, flashcards & chat</p>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
            </Link>

            <Link
              href="/dashboard/subjects"
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <BookOpen size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Manage Subjects</p>
                <p className="text-[11px] text-slate-400 truncate">Create & organize course units</p>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              href="/dashboard/subjects"
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Upload size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Upload Course Notes</p>
                <p className="text-[11px] text-slate-400 truncate">PDFs, slides & documents</p>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2-Column Layout: Recent Activity & Subject Mastery Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Activity Timeline</h3>
            <Link href="/dashboard/subjects" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-2">
            {realActivities.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No recent activities. Create a subject or upload a document to start tracking.</p>
            ) : (
              realActivities.map((act, idx) => {
                const Icon = activityIcons[act.type] || Upload;
                return (
                  <div
                    key={act.id || idx}
                    className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Icon size={16} />
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex-1 min-w-0 font-medium">
                      {act.title}
                    </p>
                    <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                      {act.time}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Subject Mastery Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5">Subject Mastery</h3>
          <div className="space-y-4">
            {realSubjects.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No subjects created yet. Add a subject to see mastery progress.</p>
            ) : (
              realSubjects.slice(0, 5).map((s) => (
                <Link key={s.id} href={`/dashboard/subjects/${s.id}`} className="block group">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {s.name}
                    </span>
                    <span className="font-bold text-slate-500">{s.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${s.progress || 0}%`,
                        backgroundColor: s.color || "#2563EB",
                      }}
                    />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

