import React from 'react';

export default function StoriesIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Back tilted card */}
      <path d="M5.2 8.5C4.6 9.8 4.4 11.5 5.2 14.5l1.4 3.5" />
      <path d="M7.8 4.2C6.4 4.8 5.6 6.4 5.2 8.5" />
      {/* Front vertical story card */}
      <rect x="8.5" y="3.5" width="11.5" height="17" rx="3.5" />
    </svg>
  );
}
