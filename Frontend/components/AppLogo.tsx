"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface AppLogoProps {
  collapsed?: boolean;
  size?: "sm" | "md" | "lg";
  linkTo?: string;
}

export default function AppLogo({ collapsed = false, size = "md", linkTo = "/" }: AppLogoProps) {
  const iconSize = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  const textSizeClass = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";

  const logoContent = (
    <div className="flex items-center gap-2.5 min-w-0 group">
      <ProjectLogoIcon 
        size={iconSize} 
        className="transition-transform group-hover:scale-105 group-hover:rotate-3 duration-300" 
      />

      {!collapsed && (
        <div className="flex flex-col min-w-0 leading-tight pt-1">
          <div className={`font-black tracking-tighter truncate ${textSizeClass}`}>
            <span className="text-blue-700 dark:text-blue-500">AI</span>{" "}
            <span className="text-slate-900 dark:text-slate-50">Study System</span>
          </div>
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="focus:outline-none">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

export function ProjectLogoIcon({
  size = 20,
  className = "",
  variant = "default",
}: {
  size?: number;
  className?: string;
  variant?: "default" | "white";
}) {
  return (
    <div 
      className={`relative shrink-0 overflow-hidden transition-all duration-300 ${className}`}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: Math.max(6, size * 0.22)
      }}
    >
      {/* We use object-cover and object-left to dynamically crop just the graduation cap icon from the provided image */}
      <Image
        src="/logo.png"
        alt="AI Study System Icon"
        fill
        sizes={`${size}px`}
        className={`object-cover object-left ${variant === "white" ? "shadow-sm ring-1 ring-white/20" : "shadow-md ring-1 ring-slate-900/5"}`}
      />
    </div>
  );
}

