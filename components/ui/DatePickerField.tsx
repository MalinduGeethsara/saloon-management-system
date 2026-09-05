"use client";

import React, { useEffect, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { CalendarOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

interface DatePickerFieldProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  minDate?: Dayjs; // defaults to today — dates before this are not selectable
  placeholder?: string;
  className?: string;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePickerField({
  value,
  onChange,
  minDate,
  placeholder = "Select a date",
  className = "",
}: DatePickerFieldProps) {
  const today = (minDate ?? dayjs()).startOf("day");
  const selected = value ? dayjs(value, "YYYY-MM-DD") : null;

  const [isOpen, setIsOpen] = useState(false);
  const [viewedMonth, setViewedMonth] = useState(selected ?? today);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setViewedMonth(selected);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const isViewingCurrentMonth = viewedMonth.isSame(today, "month");

  const startOfMonth = viewedMonth.startOf("month");
  const daysInMonth = viewedMonth.daysInMonth();
  const leadingBlanks = startOfMonth.day(); // 0 = Sunday

  const days: (Dayjs | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => startOfMonth.add(i, "day")),
  ];

  const handlePick = (day: Dayjs) => {
    if (day.isBefore(today, "day")) return;
    onChange(day.format("YYYY-MM-DD"));
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white px-4 py-3 outline-none focus:border-amber-500 transition-colors font-mono cursor-pointer text-left ${className}`}
      >
        <span className={selected ? "" : "text-zinc-500 dark:text-zinc-500"}>
          {selected ? selected.format("ddd, DD MMM YYYY") : placeholder}
        </span>
        <CalendarOutlined className="text-amber-600 dark:text-amber-500" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setViewedMonth((m) => m.subtract(1, "month"))}
              disabled={isViewingCurrentMonth}
              className="p-2 text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-zinc-500 transition-colors"
              aria-label="Previous month"
            >
              <LeftOutlined />
            </button>
            <span className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
              {viewedMonth.format("MMMM YYYY")}
            </span>
            <button
              type="button"
              onClick={() => setViewedMonth((m) => m.add(1, "month"))}
              className="p-2 text-zinc-500 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
              aria-label="Next month"
            >
              <RightOutlined />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (!day) return <div key={`blank-${idx}`} />;

              const isPast = day.isBefore(today, "day");
              const isToday = day.isSame(today, "day");
              const isSelected = !!selected && day.isSame(selected, "day");

              return (
                <button
                  key={day.format("YYYY-MM-DD")}
                  type="button"
                  disabled={isPast}
                  onClick={() => handlePick(day)}
                  className={`aspect-square flex items-center justify-center text-xs font-bold transition-colors ${
                    isPast
                      ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                      : isSelected
                        ? "bg-amber-600 text-white"
                        : isToday
                          ? "border border-amber-500 text-amber-600 dark:text-amber-500 hover:bg-amber-500/10"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-500"
                  }`}
                >
                  {day.date()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
