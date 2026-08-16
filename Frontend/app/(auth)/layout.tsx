"use client";

import React from "react";
import AppLogo from "@/components/AppLogo";
import { Sparkles, FileText, Layers, HelpCircle, CheckCircle2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-full bg-background flex flex-col lg:flex-row text-foreground overflow-hidden">
      {/* Left Form Column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-8 lg:p-10 h-full overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <AppLogo linkTo="/login" />
        </div>

        {/* Main Auth Form Container */}
        <div className="my-auto py-4 w-full max-w-md mx-auto">
          {children}
        </div>
      </div>

      {/* Right Minimal & Attractive Showcase Column */}
      <div className="hidden lg:flex lg:w-1/2 h-full bg-slate-950 text-white p-10 lg:p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract Soft Radial Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 mt-6 leading-tight">
            Study smarter. <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Not harder.
            </span>
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-md leading-relaxed">
            Organize course materials, generate AI summaries, practice flashcards, and test yourself with quizzes.
          </p>
        </div>

        {/* Center Feature Cards (Sleek & Minimal) */}
        <div className="relative z-10 space-y-3.5 my-auto max-w-md">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all hover:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Smart Summaries</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Convert dense lecture slides & PDFs into concise, bulleted key takeaways.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all hover:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
              <Layers size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">3D Flashcards</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Practice active recall with interactive flip cards and mastery tracking.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex items-start gap-3.5 transition-all hover:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
              <HelpCircle size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Interactive Quizzes</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Test your knowledge with multiple choice quizzes and instant feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Minimal Stat Footer */}
        <div className="relative z-10 pt-4 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>99.4% Student Satisfaction Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}


