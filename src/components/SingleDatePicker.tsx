"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface SingleDatePickerProps {
  id?: string;
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  label?: string;
  autoClose?: boolean;
}

export default function SingleDatePicker({
  id,
  value,
  onChange,
  disabled = false,
  label = "Select Date",
  autoClose = false,
}: SingleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    // Use UTC date to avoid timezone issues
    const selectedDate = new Date(Date.UTC(displayMonth.getFullYear(), displayMonth.getMonth(), day));
    const dateString = selectedDate.toISOString().split('T')[0];
    onChange(dateString);
    // Auto-close after date selection
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const selectedDate = new Date(Date.UTC(displayMonth.getFullYear(), displayMonth.getMonth(), day));
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    return selectedDateString === value;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(displayMonth);
    const firstDay = getFirstDayOfMonth(displayMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-8"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelected(day);

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            h-8 rounded-lg font-medium text-xs transition-all
            ${selected
              ? "bg-blue-600 text-white font-bold shadow-lg"
              : "text-gray-700 hover:bg-gray-100"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          disabled={disabled}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select date";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Display Field */}
      <div
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          px-3 py-2 border border-gray-300 rounded-md cursor-pointer
          bg-white hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}
        `}
        role="button"
        tabIndex={0}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !disabled && setIsOpen(!isOpen);
          }
        }}
      >
        <div className="text-sm font-medium text-gray-900">
          {formatDisplayDate(value)}
        </div>
      </div>

      {/* Calendar Popup */}
      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full max-w-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">{monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}</h3>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                  title="Previous Month"
                  aria-label="Previous Month"
                >
                  <ChevronLeft size={16} className="text-blue-600" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                  title="Next Month"
                  aria-label="Next Month"
                >
                  <ChevronRight size={16} className="text-blue-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            <div>
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="h-8 flex items-center justify-center font-semibold text-blue-600 text-xs">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

