"use client";

import React from "react";
import Link from "next/link";

interface AppLogoProps {
  collapsed?: boolean;
  size?: "sm" | "md" | "lg";
  linkTo?: string;
}

export default function AppLogo({ collapsed = false, size = "md", linkTo = "/" }: AppLogoProps) {
  const iconSize = size === "sm" ? 32 : size === "lg" ? 48 : 38;
  const textClass =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  const logoContent = (
    <div className="flex items-center gap-2.5 min-w-0 group">
      {/* Dual-Hemisphere Circuit & AI Neural Brain Logo SVG */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform group-hover:scale-105 duration-200"
      >
        <defs>
          {/* Left Hemisphere Blue Circuit Gradient */}
          <linearGradient id="leftBrainGrad" x1="10" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          {/* Right Hemisphere Purple Network Gradient */}
          <linearGradient id="rightBrainGrad" x1="50" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>

        {/* LEFT HEMISPHERE - CIRCUIT TRACES */}
        <g stroke="url(#leftBrainGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Outer brain lobes */}
          <path d="M 47 12 C 32 12, 18 20, 18 34 C 10 38, 8 48, 12 56 C 8 64, 12 76, 24 80 C 30 88, 43 90, 47 90" />
          <path d="M 47 24 C 36 24, 27 30, 29 42 C 20 46, 20 56, 25 62 C 22 70, 29 78, 38 78" />
          
          {/* Internal circuit lines */}
          <path d="M 47 36 L 36 36 L 31 44 L 40 44" />
          <path d="M 47 50 L 30 50 L 25 58" />
          <path d="M 47 64 L 35 64 L 30 70" />
        </g>

        {/* Left Circuit Terminal Nodes */}
        <g fill="url(#leftBrainGrad)">
          <circle cx="40" cy="44" r="3.5" />
          <circle cx="25" cy="58" r="3.5" />
          <circle cx="30" cy="70" r="3.5" />
          <circle cx="29" cy="42" r="3" />
          <circle cx="25" cy="62" r="3" />
        </g>

        {/* CENTER DIVISION LINE */}
        <line x1="49.5" y1="10" x2="49.5" y2="90" stroke="url(#leftBrainGrad)" strokeWidth="3" strokeDasharray="4 3" opacity="0.7" />

        {/* RIGHT HEMISPHERE - NEURAL NETWORK MESH */}
        <g stroke="url(#rightBrainGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Outer boundary network connections */}
          <line x1="52" y1="14" x2="65" y2="12" />
          <line x1="65" y1="12" x2="80" y2="18" />
          <line x1="80" y1="18" x2="90" y2="32" />
          <line x1="90" y1="32" x2="86" y2="46" />
          <line x1="86" y1="46" x2="90" y2="60" />
          <line x1="90" y1="60" x2="81" y2="75" />
          <line x1="81" y1="75" x2="67" y2="86" />
          <line x1="67" y1="86" x2="52" y2="88" />

          {/* Internal network web interconnects */}
          <line x1="65" y1="12" x2="63" y2="29" />
          <line x1="80" y1="18" x2="63" y2="29" />
          <line x1="80" y1="18" x2="75" y2="38" />
          <line x1="90" y1="32" x2="75" y2="38" />
          <line x1="63" y1="29" x2="52" y2="35" />
          <line x1="63" y1="29" x2="75" y2="38" />

          <line x1="52" y1="35" x2="59" y2="50" />
          <line x1="75" y1="38" x2="59" y2="50" />
          <line x1="75" y1="38" x2="86" y2="46" />
          <line x1="86" y1="46" x2="73" y2="58" />

          <line x1="59" y1="50" x2="73" y2="58" />
          <line x1="59" y1="50" x2="52" y2="64" />
          <line x1="73" y1="58" x2="90" y2="60" />
          <line x1="73" y1="58" x2="77" y2="72" />

          <line x1="52" y1="64" x2="63" y2="74" />
          <line x1="77" y1="72" x2="63" y2="74" />
          <line x1="77" y1="72" x2="81" y2="75" />
          <line x1="63" y1="74" x2="67" y2="86" />
        </g>

        {/* Right Network Node Points */}
        <g fill="url(#rightBrainGrad)">
          <circle cx="65" cy="12" r="4" />
          <circle cx="80" cy="18" r="4" />
          <circle cx="90" cy="32" r="4" />
          <circle cx="86" cy="46" r="4" />
          <circle cx="90" cy="60" r="4" />
          <circle cx="81" cy="75" r="4" />
          <circle cx="67" cy="86" r="4" />

          <circle cx="63" cy="29" r="4" />
          <circle cx="75" cy="38" r="4" />
          <circle cx="59" cy="50" r="4" />
          <circle cx="73" cy="58" r="4" />
          <circle cx="77" cy="72" r="4" />
          <circle cx="63" cy="74" r="4" />

          <circle cx="52" cy="14" r="3" />
          <circle cx="52" cy="35" r="3" />
          <circle cx="52" cy="64" r="3" />
          <circle cx="52" cy="88" r="3" />
        </g>
      </svg>

      {!collapsed && (
        <div className="flex flex-col min-w-0 leading-tight">
          <span className={`font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate ${textClass}`}>
            StudyAI
          </span>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
            Assistant
          </span>
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
  const rawId = typeof React !== "undefined" && (React as any).useId ? (React as any).useId() : Math.random().toString();
  const cleanId = String(rawId).replace(/[^a-zA-Z0-0]/g, "");
  const leftGradId = `leftBrainGrad_${cleanId}`;
  const rightGradId = `rightBrainGrad_${cleanId}`;

  const isWhite = variant === "white";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform ${className}`}
    >
      <defs>
        <linearGradient id={leftGradId} x1="10" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isWhite ? "#FFFFFF" : "#2563EB"} />
          <stop offset="50%" stopColor={isWhite ? "#FFFFFF" : "#3B82F6"} />
          <stop offset="100%" stopColor={isWhite ? "#FFFFFF" : "#60A5FA"} />
        </linearGradient>

        <linearGradient id={rightGradId} x1="50" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isWhite ? "#FFFFFF" : "#7C3AED"} />
          <stop offset="50%" stopColor={isWhite ? "#FFFFFF" : "#8B5CF6"} />
          <stop offset="100%" stopColor={isWhite ? "#FFFFFF" : "#C084FC"} />
        </linearGradient>
      </defs>

      {/* LEFT HEMISPHERE - CIRCUIT TRACES */}
      <g stroke={`url(#${leftGradId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M 47 12 C 32 12, 18 20, 18 34 C 10 38, 8 48, 12 56 C 8 64, 12 76, 24 80 C 30 88, 43 90, 47 90" />
        <path d="M 47 24 C 36 24, 27 30, 29 42 C 20 46, 20 56, 25 62 C 22 70, 29 78, 38 78" />
        <path d="M 47 36 L 36 36 L 31 44 L 40 44" />
        <path d="M 47 50 L 30 50 L 25 58" />
        <path d="M 47 64 L 35 64 L 30 70" />
      </g>

      <g fill={`url(#${leftGradId})`}>
        <circle cx="40" cy="44" r="3.5" />
        <circle cx="25" cy="58" r="3.5" />
        <circle cx="30" cy="70" r="3.5" />
        <circle cx="29" cy="42" r="3" />
        <circle cx="25" cy="62" r="3" />
      </g>

      <line x1="49.5" y1="10" x2="49.5" y2="90" stroke={`url(#${leftGradId})`} strokeWidth="3" strokeDasharray="4 3" opacity="0.7" />

      {/* RIGHT HEMISPHERE - NEURAL NETWORK MESH */}
      <g stroke={`url(#${rightGradId})`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="52" y1="14" x2="65" y2="12" />
        <line x1="65" y1="12" x2="80" y2="18" />
        <line x1="80" y1="18" x2="90" y2="32" />
        <line x1="90" y1="32" x2="86" y2="46" />
        <line x1="86" y1="46" x2="90" y2="60" />
        <line x1="90" y1="60" x2="81" y2="75" />
        <line x1="81" y1="75" x2="67" y2="86" />
        <line x1="67" y1="86" x2="52" y2="88" />
        <line x1="65" y1="12" x2="63" y2="29" />
        <line x1="80" y1="18" x2="63" y2="29" />
        <line x1="80" y1="18" x2="75" y2="38" />
        <line x1="90" y1="32" x2="75" y2="38" />
        <line x1="63" y1="29" x2="52" y2="35" />
        <line x1="63" y1="29" x2="75" y2="38" />
        <line x1="52" y1="35" x2="59" y2="50" />
        <line x1="75" y1="38" x2="59" y2="50" />
        <line x1="75" y1="38" x2="86" y2="46" />
        <line x1="86" y1="46" x2="73" y2="58" />
        <line x1="59" y1="50" x2="73" y2="58" />
        <line x1="59" y1="50" x2="52" y2="64" />
        <line x1="73" y1="58" x2="90" y2="60" />
        <line x1="73" y1="58" x2="77" y2="72" />
        <line x1="52" y1="64" x2="63" y2="74" />
        <line x1="77" y1="72" x2="63" y2="74" />
        <line x1="77" y1="72" x2="81" y2="75" />
        <line x1="63" y1="74" x2="67" y2="86" />
      </g>

      <g fill={`url(#${rightGradId})`}>
        <circle cx="65" cy="12" r="4" />
        <circle cx="80" cy="18" r="4" />
        <circle cx="90" cy="32" r="4" />
        <circle cx="86" cy="46" r="4" />
        <circle cx="90" cy="60" r="4" />
        <circle cx="81" cy="75" r="4" />
        <circle cx="67" cy="86" r="4" />
        <circle cx="63" cy="29" r="4" />
        <circle cx="75" cy="38" r="4" />
        <circle cx="59" cy="50" r="4" />
        <circle cx="73" cy="58" r="4" />
        <circle cx="77" cy="72" r="4" />
        <circle cx="63" cy="74" r="4" />
        <circle cx="52" cy="14" r="3" />
        <circle cx="52" cy="35" r="3" />
        <circle cx="52" cy="64" r="3" />
        <circle cx="52" cy="88" r="3" />
      </g>
    </svg>
  );
}

