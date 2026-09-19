"use client";

import React from "react";
import { SearchOutlined, CloseCircleFilled } from "@ant-design/icons";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  // e.g. "3 of 12 services": shown under the box while searching
  resultText?: string;
  className?: string;
  autoFocus?: boolean;
}

// The public site's search box: big enough to tap, 16px text (stops iOS zooming in on focus), one-tap clear.
export default function SearchBar({ value, onChange, placeholder = "Search...", resultText, className = "", autoFocus }: SearchBarProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full h-12 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-base pl-11 pr-11 outline-none focus:border-amber-500 dark:focus:border-amber-500 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <CloseCircleFilled />
          </button>
        )}
      </div>
      {resultText && value.trim() && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">{resultText}</p>
      )}
    </div>
  );
}
