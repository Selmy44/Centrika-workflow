"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { getHolidayType, calculateWorkingDays } from "@/utils/leaveCalculator";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  disabled?: boolean;
  maxDays: number;
  takenLeaveDates?: string[];
  isFixedDuration?: boolean;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  maxDays,
  takenLeaveDates = [],
  isFixedDuration = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isOpen) {
      if (startDate) {
        const [year, month] = startDate.split('-').map(Number);
        setDisplayMonth(new Date(year, month - 1));
      } else {
        const today = new Date();
        setDisplayMonth(new Date(today.getFullYear(), today.getMonth()));
      }
      // Only reset selectingEnd when calendar first opens
      if (isFixedDuration) {
        setSelectingEnd(false);
      } else if (!startDate && !endDate) {
        setSelectingEnd(false);
      }
    }
  }, [isOpen, isFixedDuration]);

  // Lock body scroll when calendar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const isTakenLeave = (dateString: string) => {
    return takenLeaveDates.includes(dateString);
  };

  const isToday = (dateString: string) => {
    return dateString === getTodayString();
  };

  const isStartDate = (dateString: string) => {
    return dateString === startDate;
  };

  const isEndDate = (dateString: string) => {
    return dateString === endDate;
  };

  const isInRange = (dateString: string) => {
    if (!startDate || !endDate) return false;
    return dateString > startDate && dateString < endDate;
  };

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

  const handleDateClick = (day: number, month: number, year: number) => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (isTakenLeave(dateString)) return;

    if (isFixedDuration) {
      onStartDateChange(dateString);
      return;
    }

    if (!selectingEnd) {
      onStartDateChange(dateString);
      setSelectingEnd(true);
    } else {
      if (dateString >= startDate) {
        onEndDateChange(dateString);
        setSelectingEnd(false);
        // Don't close immediately - let user see the range highlighted
        // They can click Done button or click outside to close
      } else {
        onStartDateChange(dateString);
        setSelectingEnd(true);
      }
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Short day labels for mobile, full for desktop
  const daysOfWeekShort = ["S", "M", "T", "W", "T", "F", "S"];
  const daysOfWeekFull = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderMonthDays = (month: Date) => {
    const days = [];
    const daysInMonth = getDaysInMonth(month);
    const firstDay = getFirstDayOfMonth(month);
    const monthIndex = month.getMonth();
    const year = month.getFullYear();

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 md:h-10"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const start = isStartDate(dateString);
      const end = isEndDate(dateString);
      const inRange = isInRange(dateString);
      const taken = isTakenLeave(dateString);
      const today = isToday(dateString);

      const dateObj = new Date(year, monthIndex, day);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const holidayType = getHolidayType(dateString);

      let bgColor = "bg-white hover:bg-gray-100 dark:bg-[#1f426b] dark:hover:bg-[#295482]";
      let textColor = "text-gray-800 dark:text-slate-200";

      // Priority order: taken > start/end > inRange > today > weekend > holiday > default
      if (taken) {
        bgColor = "bg-red-100 dark:bg-red-900/30 cursor-not-allowed opacity-60";
        textColor = "text-red-700 dark:text-red-300 line-through";
      } else if (start || end) {
        bgColor = "bg-blue-600 dark:bg-blue-500 shadow-md";
        textColor = "text-white font-bold";
      } else if (inRange) {
        bgColor = "bg-blue-100 dark:bg-blue-900/40";
        textColor = "text-blue-900 dark:text-blue-200 font-semibold";
      } else if (today) {
        bgColor = "bg-orange-400 dark:bg-orange-500 shadow-sm";
        textColor = "text-white font-bold";
      } else if (isWeekend) {
        bgColor = "bg-purple-50 dark:bg-purple-900/20";
        textColor = "text-purple-600 dark:text-purple-300";
      } else if (holidayType) {
        bgColor = "bg-cyan-50 dark:bg-cyan-900/20";
        textColor = "text-cyan-700 dark:text-cyan-300";
      }

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day, monthIndex, year)}
          disabled={disabled || taken}
          className={`h-8 md:h-10 rounded-md font-semibold text-xs md:text-sm ${bgColor} ${textColor} transition-all duration-150 ${
            disabled || taken ? "cursor-not-allowed" : "cursor-pointer active:scale-95"
          }`}
          title={
            taken
              ? "Already on leave"
              : holidayType
              ? "Holiday"
              : isWeekend
              ? "Weekend"
              : ""
          }
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Select date";
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return "Select";
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const nextMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ===== TRIGGER: Start Date / End Date / Duration ===== */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
        {/* Start Date */}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex-1 px-3 md:px-4 py-2.5 md:py-3 border-2 rounded-lg cursor-pointer transition-colors ${
            selectingEnd && isOpen
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-blue-300 dark:border-[#3b6dae]/50 bg-white dark:bg-[#1f426b] hover:bg-blue-50 dark:hover:bg-[#295482]"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#295482]" : ""}`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-600 dark:text-blue-400 shrink-0 md:w-[18px] md:h-[18px]" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-slate-400">Start Date</span>
              <span className="font-semibold text-xs md:text-sm text-gray-900 dark:text-slate-100 truncate">
                <span className="hidden sm:inline">{formatDate(startDate)}</span>
                <span className="sm:hidden">{formatDateShort(startDate)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Arrow separator — hidden on mobile */}
        <div className="hidden sm:flex items-center text-blue-400 dark:text-blue-500">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>

        {/* End Date */}
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex-1 px-3 md:px-4 py-2.5 md:py-3 border-2 rounded-lg cursor-pointer transition-colors ${
            !selectingEnd && isOpen && startDate
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-blue-300 dark:border-[#3b6dae]/50 bg-white dark:bg-[#1f426b] hover:bg-blue-50 dark:hover:bg-[#295482]"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#295482]" : ""}`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-600 dark:text-blue-400 shrink-0 md:w-[18px] md:h-[18px]" />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] md:text-xs text-gray-500 dark:text-slate-400">End Date</span>
              <span className="font-semibold text-xs md:text-sm text-gray-900 dark:text-slate-100 truncate">
                <span className="hidden sm:inline">{formatDate(endDate)}</span>
                <span className="sm:hidden">{formatDateShort(endDate)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Duration badge */}
        {startDate && endDate && (
          <div className="px-3 md:px-4 py-2 md:py-3 rounded-lg border-2 border-blue-300 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-900/30 text-center shrink-0">
            <div className="text-[10px] md:text-xs text-blue-600 dark:text-blue-300">Duration</div>
            <div className="font-bold text-base md:text-lg text-blue-900 dark:text-blue-100 leading-tight">
            {calculateWorkingDays(startDate, endDate)} business days
            </div>
          </div>
        )}
      </div>

      {/* ===== CALENDAR DROPDOWN ===== */}
      {isOpen && !disabled && (
        <>
          {/* Mobile: full-screen overlay backdrop */}
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setIsOpen(false)} />

          {/* Calendar panel */}
          <div className="
            fixed inset-x-0 bottom-0 top-auto z-50
            md:absolute md:inset-auto md:top-full md:left-0 md:mt-2
            bg-white dark:bg-[#1a3254] border-2 border-blue-300 dark:border-blue-700
            md:rounded-xl rounded-t-2xl shadow-2xl
            md:w-full md:max-w-4xl
            max-h-[85vh] md:max-h-[none] overflow-y-auto
          ">
            {/* Header */}
            <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-3 md:py-4 md:rounded-t-lg rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-sm md:text-lg">Select Your Leave Dates</h3>
                <p className="text-blue-100 text-xs md:text-sm">
                  {isFixedDuration
                    ? "Select your start date"
                    : selectingEnd
                    ? "Select your end date"
                    : "Select your start date"}
                </p>
              </div>
              {/* Close button — always visible, especially helpful on mobile */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-blue-500 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:justify-between gap-6 md:gap-8">
                {/* First Month */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#295482] rounded-lg transition-colors">
                      <ChevronLeft size={18} className="md:w-5 md:h-5" />
                    </button>
                    <h4 className="font-bold text-sm md:text-lg text-gray-900 dark:text-slate-100">
                      {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
                    </h4>
                    {/* Spacer on desktop, nav on mobile */}
                    <div className="w-8 md:w-10 hidden md:block"></div>
                    <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#295482] rounded-lg transition-colors md:hidden">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 md:gap-2 mb-1 md:mb-2">
                    {daysOfWeekFull.map((d, i) => (
                      <div key={d} className="text-center font-bold text-blue-600 dark:text-blue-400 text-[10px] md:text-xs h-6 md:h-8 flex items-center justify-center">
                        <span className="hidden md:inline">{d}</span>
                        <span className="md:hidden">{daysOfWeekShort[i]}</span>
                      </div>
                    ))}
                  </div>
                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {renderMonthDays(displayMonth)}
                  </div>
                </div>

                {/* Second Month — hidden on mobile, shown on md+ */}
                <div className="hidden md:block flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10"></div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-slate-100">
                      {monthNames[nextMonth.getMonth()]}{" "}
                      {nextMonth.getFullYear()}
                    </h4>
                    <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#295482] rounded-lg transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {daysOfWeekFull.map((d) => (
                      <div key={d} className="text-center font-bold text-blue-600 dark:text-blue-400 text-xs h-8 flex items-center justify-center">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {renderMonthDays(nextMonth)}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="px-3 md:px-6 py-3 md:py-4 bg-gray-50 dark:bg-[#162d4a] border-t-2 border-gray-200 dark:border-blue-800">
              <p className="text-[10px] md:text-xs font-bold text-gray-700 dark:text-slate-300 mb-2 md:mb-3">Legend:</p>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-x-3 gap-y-1.5 md:gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 md:w-5 md:h-5 bg-blue-600 rounded shrink-0"></div>
                  <span className="text-[9px] md:text-xs text-gray-600 dark:text-slate-400">Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 md:w-5 md:h-5 bg-blue-100 dark:bg-blue-900/40 rounded shrink-0"></div>
                  <span className="text-[9px] md:text-xs text-gray-600 dark:text-slate-400">In Range</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 md:w-5 md:h-5 bg-orange-400 rounded shrink-0"></div>
                  <span className="text-[9px] md:text-xs text-gray-600 dark:text-slate-400">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 md:w-5 md:h-5 bg-red-100 dark:bg-red-900/30 rounded shrink-0"></div>
                  <span className="text-[9px] md:text-xs text-gray-600 dark:text-slate-400">On Leave</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 md:w-5 md:h-5 bg-purple-50 dark:bg-purple-900/20 rounded shrink-0 border border-purple-200"></div>
                  <span className="text-[9px] md:text-xs text-gray-600 dark:text-slate-400">Weekend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 md:w-5 md:h-5 bg-cyan-50 dark:bg-cyan-900/20 rounded shrink-0 border border-cyan-200"></div>
                  <span className="text-[9px] md:text-xs text-gray-600 dark:text-slate-400">Holiday</span>
                </div>
              </div>
            </div>

            {/* Footer with selection summary + Done */}
            {startDate && endDate && (
              <div className="px-3 md:px-6 py-3 md:py-4 bg-blue-50 dark:bg-blue-900/30 border-t-2 border-blue-200 dark:border-blue-700 md:rounded-b-lg">
                <div className="flex justify-between items-center">
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-gray-600 dark:text-slate-400 truncate">
                      <span className="font-semibold">{formatDate(startDate)}</span> to{" "}
                      <span className="font-semibold">{formatDate(endDate)}</span>
                    </p>
                    <p className="text-xs md:text-sm text-blue-600 dark:text-blue-300 mt-1 font-bold">
                      {calculateWorkingDays(startDate, endDate)} business days
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shrink-0 ml-3 active:scale-95"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
