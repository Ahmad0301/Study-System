"use client";

import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mb-4 ring-8 ring-blue-50/50 dark:ring-blue-950/20 text-blue-600 dark:text-blue-400">
        <Icon size={28} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default" className="shadow-md shadow-blue-500/20">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
