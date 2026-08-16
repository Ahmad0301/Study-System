"use client";

import React from "react";
import { Check, X } from "lucide-react";

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);

  const score = [hasMinLength, hasNumber, hasSpecial, hasUpper].filter(Boolean).length;

  const getStrengthText = () => {
    if (score <= 1) return { label: "Weak", color: "bg-red-500", text: "text-red-500" };
    if (score === 2 || score === 3) return { label: "Medium", color: "bg-amber-500", text: "text-amber-500" };
    return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" };
  };

  const strength = getStrengthText();

  return (
    <div className="mt-2 space-y-2 animate-in fade-in duration-200">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-slate-400">Password strength:</span>
        <span className={`font-bold ${strength.text}`}>{strength.label}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`rounded-full transition-all duration-300 ${
              step <= score ? strength.color : "bg-slate-200 dark:bg-slate-800"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px]">
        <div className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-400 dark:text-slate-500"}`}>
          {hasMinLength ? <Check size={12} /> : <X size={12} />} 8+ characters
        </div>
        <div className={`flex items-center gap-1 ${hasNumber ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-400 dark:text-slate-500"}`}>
          {hasNumber ? <Check size={12} /> : <X size={12} />} At least 1 number
        </div>
        <div className={`flex items-center gap-1 ${hasUpper ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-400 dark:text-slate-500"}`}>
          {hasUpper ? <Check size={12} /> : <X size={12} />} Uppercase letter
        </div>
        <div className={`flex items-center gap-1 ${hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-gray-400 dark:text-slate-500"}`}>
          {hasSpecial ? <Check size={12} /> : <X size={12} />} Special character
        </div>
      </div>
    </div>
  );
}
