"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { authService } from "@/lib/services/authService";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    authService
      .verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message || "Email verified successfully!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link may be invalid or expired.");
      });
  }, [token]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 text-center">
      {status === "loading" && (
        <>
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Loader2 size={32} className="text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">
            Verifying your email…
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please wait while we verify your email address.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">
            Email verified!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {message}. You can now sign in to your account.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
          >
            Go to Sign in
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <XCircle size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-slate-100">
            Verification failed
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {message}
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Create a new account
            </Link>
            <Link
              href="/login"
              className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go to Sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
