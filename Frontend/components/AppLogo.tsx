"use client";

import Link from "next/link";
import Image from "next/image";

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
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="relative shrink-0 rounded-xl overflow-hidden shadow-lg ring-2 ring-blue-500/30"
        style={{ width: iconSize, height: iconSize }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width={iconSize * 0.6}
            height={iconSize * 0.6}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7l10 5 10-5-10-5z"
              fill="white"
              fillOpacity="0.95"
            />
            <path
              d="M2 17l10 5 10-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.8"
            />
            <path
              d="M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="18" cy="6" r="3" fill="#60A5FA" fillOpacity="0.9" />
            <path
              d="M17.5 5.5l1 1 1.5-1.5"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {!collapsed && (
        <div className="flex flex-col min-w-0 leading-tight">
          <span className={`font-bold text-gray-900 truncate ${textClass}`}>
            StudyAI
          </span>
          <span className="text-[10px] font-medium text-blue-600 tracking-wider uppercase">
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
