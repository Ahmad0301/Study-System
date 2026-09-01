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
  // Adjust logo dimensions based on the size prop
  const height = size === "sm" ? 32 : size === "lg" ? 48 : 40;
  // The provided logo is horizontal. We calculate width to maintain aspect ratio for the full logo
  // When collapsed, we constrain the width to be equal to height to show only the icon part
  const width = height * 4.2; 

  const logoContent = (
    <div className="flex items-center gap-2.5 min-w-0 group">
      <div 
        className="relative shrink-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.03]" 
        style={{ 
          height: height, 
          width: collapsed ? height : width,
          // When collapsed, we restrict the width to show only the left part (the icon)
          // We use overflow-hidden to crop out the text
        }}
      >
        <div className={`relative w-full h-full overflow-hidden ${collapsed ? 'rounded-2xl shadow-sm' : ''}`}>
          <Image
            src="/logo.png"
            alt="AI Study System"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-left"
          />
        </div>
      </div>
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
      className={`relative shrink-0 overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${className}`}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: Math.max(8, size * 0.25)
      }}
    >
      {/* We use object-cover and object-left to frame just the icon part of the logo.png */}
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

