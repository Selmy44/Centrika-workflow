import React from "react";

type Props = {
  theme: "light" | "dark";
  className?: string;
};

// A compact, visually-rich sun/moon combined SVG with subtle transition
export default function ThemeToggleIcon({ theme, className }: Props) {
  const isDark = theme === "dark";

  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {isDark ? (
        // Bright Sun for Dark Mode
        <g style={{ transition: "all 220ms cubic-bezier(.2,.9,.2,1)" }}>
          {/* Sun rays */}
          <g stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" opacity="1">
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="19.78" y1="4.22" x2="18.36" y2="5.64" />
            <line x1="5.64" y1="18.36" x2="4.22" y2="19.78" />
          </g>
          
          {/* Main sun body */}
          <circle cx="12" cy="12" r="5" fill="#FFD700" />
          
          {/* Sun highlight */}
          <circle cx="10" cy="10" r="1.5" fill="#FFED4E" opacity="0.7" />
        </g>
      ) : (
        // System Blue Crescent Moon for Light Mode
        <g style={{ transition: "all 220ms cubic-bezier(.2,.9,.2,1)" }}>
          {/* System blue crescent moon */}
          <defs>
            <mask id="crescentMask">
              <rect width="24" height="24" fill="white" />
              <circle cx="15" cy="12" r="6.5" fill="black" />
            </mask>
          </defs>
          
          {/* Main moon body - system blue */}
          <circle cx="12" cy="12" r="8.5" fill="#3b82f6" mask="url(#crescentMask)" />
          
          {/* Subtle darker blue for depth */}
          <circle cx="12" cy="12" r="8.5" fill="#1e40af" mask="url(#crescentMask)" opacity="0.3" />
        </g>
      )}
    </svg>
  );
}
