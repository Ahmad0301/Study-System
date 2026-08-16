"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, AlertCircle, CheckCircle2, Send } from "lucide-react";
import { authService } from "@/lib/services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Email is required."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address."); return; }
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword({ email });
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {!sent ? (
        <>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
              Reset password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your email address and we&apos;ll send you a password reset link.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800/80 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle size={18} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all ${
                    error
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  }`}
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending link…</span>
                </>
              ) : (
                <>
                  <span>Send reset link</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-blue-50/50 dark:ring-blue-950/20 text-blue-600 dark:text-blue-400">
            <Mail size={30} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">Check your email</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            We have sent a password reset link to <strong className="text-slate-900 dark:text-slate-100">{email}</strong>.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Sign in</span>
        </Link>
      </div>
    </div>
  );
}

