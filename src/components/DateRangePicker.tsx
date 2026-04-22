"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getHolidayType } from "@/utils/leaveCalculator";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  disabled?: boolean;
  maxDays: number;
  takenLeaveDates?: string[];
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  maxDays,
  takenLeaveDates = [],
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
      if (!startDate && !endDate) {
        setSelectingEnd(false);
      }
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

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const renderMonthDays = (month: Date) => {
    const days = [];
    const daysInMonth = getDaysInMonth(month);
    const firstDay = getFirstDayOfMonth(month);
    const monthIndex = month.getMonth();
    const year = month.getFullYear();

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
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

      let bgColor = "bg-white hover:bg-gray-100";
      let textColor = "text-gray-800";

      // Priority order: taken > start/end > inRange > today > weekend > holiday > default
      if (taken) {
        bgColor = "bg-red-100 cursor-not-allowed opacity-60";
        textColor = "text-red-700 line-through";
      } else if (start || end) {
        bgColor = "bg-blue-600";
        textColor = "text-white font-bold";
      } else if (inRange) {
        bgColor = "bg-blue-200";
        textColor = "text-blue-900 font-semibold";
      } else if (today) {
        bgColor = "bg-orange-300";
        textColor = "text-orange-900 font-bold";
      } else if (isWeekend) {
        bgColor = "bg-purple-100";
        textColor = "text-purple-700";
      } else if (holidayType) {
        bgColor = "bg-cyan-100";
        textColor = "text-cyan-700";
      }

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day, monthIndex, year)}
          disabled={disabled || taken}
          className={`h-10 rounded font-semibold text-sm ${bgColor} ${textColor} transition-colors ${
            disabled || taken ? "cursor-not-allowed" : "cursor-pointer"
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

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex gap-4 items-center">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg cursor-pointer bg-white hover:bg-blue-50 transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-600">Check-in</span>
              <span className="font-semibold text-gray-900">{formatDate(startDate)}</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg cursor-pointer bg-white hover:bg-blue-50 transition-colors ${
            disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-600">Check-out</span>
              <span className="font-semibold text-gray-900">{formatDate(endDate)}</span>
            </div>
          </div>
        </div>

        {startDate && endDate && (
          <div className="px-4 py-3 rounded-lg border-2 border-blue-300 bg-blue-100 text-center">
            <div className="text-xs text-blue-600">Duration</div>
            <div className="font-bold text-lg text-blue-900">
              {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
            </div>
          </div>
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 left-0 bg-white border-2 border-blue-300 rounded-xl shadow-2xl z-50 w-full max-w-4xl">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h3 className="font-bold text-lg">Select Your Leave Dates</h3>
            <p className="text-blue-100 text-sm">
              {selectingEnd ? "Select your end date" : "Select your start date"}
            </p>
          </div>

          <div className="p-6">
            <div className="flex justify-between gap-8">
              {/* First Month */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded">
                    <ChevronLeft size={20} />
                  </button>
                  <h4 className="font-bold text-lg">
                    {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
                  </h4>
                  <div className="w-10"></div>
                </div>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {daysOfWeek.map((d) => (
                    <div key={d} className="text-center font-bold text-blue-600 text-xs h-8 flex items-center justify-center">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {renderMonthDays(displayMonth)}
                </div>
              </div>

              {/* Second Month */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10"></div>
                  <h4 className="font-bold text-lg">
                    {monthNames[new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1).getMonth()]}{" "}
                    {new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1).getFullYear()}
                  </h4>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded">
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {daysOfWeek.map((d) => (
                    <div key={d} className="text-center font-bold text-blue-600 text-xs h-8 flex items-center justify-center">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {renderMonthDays(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1))}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-300">
            <p className="text-xs font-bold text-gray-700 mb-3">Legend:</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-600 rounded"></div>
                <span className="text-xs">Selected (Start/End)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-200 rounded"></div>
                <span className="text-xs">In Range</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-orange-300 rounded"></div>
                <span className="text-xs">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-red-100 rounded"></div>
                <span className="text-xs">Already on Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-100 rounded"></div>
                <span className="text-xs">Weekend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-cyan-100 rounded"></div>
                <span className="text-xs">Holiday</span>
              </div>
            </div>
          </div>

          {startDate && endDate && (
            <div className="px-6 py-4 bg-blue-50 border-t-2 border-blue-300 rounded-b-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">{formatDate(startDate)}</span> to{" "}
                    <span className="font-semibold">{formatDate(endDate)}</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-2 font-bold">
                    {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
