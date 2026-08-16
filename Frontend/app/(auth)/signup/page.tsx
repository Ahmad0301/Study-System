"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, User, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";
import { authService } from "@/lib/services/authService";
import { PasswordStrength } from "@/components/ui/PasswordStrength";

export default function SignupPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    else if (form.fullName.trim().length < 2) e.fullName = "Name must be at least 2 characters.";
    if (!form.email) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await authService.signup(form);
      setSuccess(true);
    } catch (err: any) {
      setErrors({ form: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    try {
      await authService.resendVerification(form.email);
      setResendMsg("Verification email resent! Check your inbox.");
    } catch (err: any) {
      setResendMsg(err.message || "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "", form: "" }));
  };

  // ── Success screen ──
  if (success) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
          Check your email
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
          We&apos;ve sent a verification link to <strong className="text-slate-700 dark:text-slate-200">{form.email}</strong>.
          Please click the link to verify your account before signing in.
        </p>

        <button
          onClick={handleResend}
          disabled={resending}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {resending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Resend verification email
        </button>

        {resendMsg && (
          <p className="text-xs text-green-600 dark:text-green-400">{resendMsg}</p>
        )}

        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800">
          <Link
            href="/login"
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Go to Sign in
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ──
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
          Create account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Join thousands of students learning 3x faster with AI.
        </p>
      </div>

      {errors.form && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-800/80 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Muhammad Ahmad"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all ${
                errors.fullName
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              }`}
            />
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          </div>
          {errors.fullName && <p className="mt-1 text-xs font-medium text-red-500">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="muhammad123@gmail.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all ${
                errors.email
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              }`}
            />
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          </div>
          {errors.email && <p className="mt-1 text-xs font-medium text-red-500">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all ${
                errors.password
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              }`}
            />
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs font-medium text-red-500">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all ${
                errors.confirmPassword
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              }`}
            />
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-xs font-medium text-red-500">{errors.confirmPassword}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Creating account…</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login Link */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline transition-all"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
