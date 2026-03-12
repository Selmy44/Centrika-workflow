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
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  maxDays,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
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

  const calculateBusinessDaysForDateRange = (startDateStr: string, endDateStr: string) => {
    if (!startDateStr || !endDateStr) return 0;

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    let businessDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateString = current.toISOString().split('T')[0];
      const holidayType = getHolidayType(dateString);

      // Count only weekdays (Mon-Fri) that are not holidays
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayType) {
        businessDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return businessDays;
  };

  const handleDateClick = (day: number) => {
    // Create date string directly without timezone issues
    const year = displayMonth.getFullYear();
    const month = String(displayMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;

    if (!selectingEnd) {
      // First click: set start date and move to end date selection
      onStartDateChange(dateString);
      setSelectingEnd(true);
      // Move to next month for end date selection
      setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1));
    } else {
      // Second click: set end date with validation
      if (dateString >= startDate) {
        const businessDaysCount = calculateBusinessDaysForDateRange(startDate, dateString);
        if (businessDaysCount <= maxDays) {
          onEndDateChange(dateString);
          setSelectingEnd(false);
        }
        // If exceeds 18 days, don't set the end date - user will see warning in footer
      }
    }
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const year = displayMonth.getFullYear();
    const month = String(displayMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    return dateString > startDate && dateString < endDate;
  };

  const isStartDate = (day: number) => {
    if (!startDate) return false;
    const year = displayMonth.getFullYear();
    const month = String(displayMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    return dateString === startDate;
  };

  const isEndDate = (day: number) => {
    if (!endDate) return false;
    const year = displayMonth.getFullYear();
    const month = String(displayMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    return dateString === endDate;
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
        <div key={`empty-${i}`} className="h-12"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isStart = isStartDate(day);
      const isEnd = isEndDate(day);
      const inRange = isInRange(day);

      const year = displayMonth.getFullYear();
      const month = String(displayMonth.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateString = `${year}-${month}-${dayStr}`;
      const holidayType = getHolidayType(dateString);

      const dateObj = new Date(year, displayMonth.getMonth(), day);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`
            h-12 rounded-lg font-bold text-sm transition-all relative flex items-center justify-center
            ${isStart || isEnd
              ? "bg-blue-600 text-white font-bold shadow-lg"
              : inRange
                ? "bg-blue-200 text-blue-900 font-semibold"
                : isWeekend
                  ? "bg-purple-100 text-purple-700"
                  : holidayType
                    ? "bg-cyan-100 text-cyan-700"
                    : "text-gray-800 hover:bg-gray-200"
            }
            ${selectingEnd && inRange ? "opacity-100" : ""}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          disabled={disabled}
          title={holidayType ? "Holiday" : isWeekend ? "Weekend" : ""}
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

  const getDayCount = () => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let businessDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const dateString = current.toISOString().split('T')[0];
      const holidayType = getHolidayType(dateString);

      // Count only weekdays (Mon-Fri) that are not holidays
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayType) {
        businessDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return businessDays;
  };

  const getDayColorClass = (year: number, month: number, day: number) => {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holidayType = getHolidayType(dateString);
    const dateObj = new Date(year, month, day);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

    if (isWeekend) return { bg: "bg-purple-100", text: "text-purple-700", title: "Weekend" };
    if (holidayType) return { bg: "bg-cyan-100", text: "text-cyan-700", title: "Holiday" };
    return { bg: "text-gray-800 hover:bg-gray-200", text: "", title: "" };
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Display Field */}
      <div className="flex gap-4 items-center">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg cursor-pointer
            bg-white hover:bg-blue-50 transition-colors
            ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}
          `}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-600">Check-in</span>
              <span className="font-semibold text-gray-900">{formatDisplayDate(startDate)}</span>
            </div>
          </div>
        </div>

        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            flex-1 px-4 py-3 border-2 border-blue-300 rounded-lg cursor-pointer
            bg-white hover:bg-blue-50 transition-colors
            ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}
          `}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <div className="flex flex-col">
              <span className="text-xs text-gray-600">Check-out</span>
              <span className="font-semibold text-gray-900">{formatDisplayDate(endDate)}</span>
            </div>
          </div>
        </div>

        {/* Duration Badge */}
        {startDate && endDate && (
          <div className="flex items-center gap-2">
            <div className={`px-4 py-3 rounded-lg border-2 text-center flex-1 transition-colors ${getDayCount() > maxDays
              ? "bg-red-100 border-red-300"
              : "bg-blue-100 border-blue-300"
              }`}>
              <div className={`text-xs ${getDayCount() > maxDays ? "text-red-600" : "text-blue-600"}`}>Duration</div>
              <div className={`font-bold text-lg ${getDayCount() > maxDays ? "text-red-900" : "text-blue-900"}`}>{getDayCount()} days</div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Popup */}
      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 left-0 bg-white border-2 border-blue-300 rounded-xl shadow-2xl z-50 w-full max-w-4xl">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-3 rounded-t-lg">
            <h3 className="text-base font-bold mb-1">Select Your Leave Dates</h3>
            <p className="text-blue-100 text-xs">
              {selectingEnd ? "Select your end date" : "Select your start date"}
            </p>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            {/* Two Month Calendar Grid with top arrows */}
            <div className="flex items-start justify-center gap-8">
              {/* Calendar Months */}
              <div className="grid grid-cols-2 gap-8">
                {/* First Month */}
                <div>
                  <h4 className="font-bold text-gray-800 text-xl text-center mb-3">
                    {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
                  </h4>

                  {/* Days of week with left arrow above Sun */}
                  <div className="grid grid-cols-7 gap-3 mb-2">
                    {daysOfWeek.map((day, index) => (
                      <div key={day} className="relative">
                        {index === 0 && (
                          <button
                            onClick={handlePrevMonth}
                            className="absolute -top-8 left-1/2 transform -translate-x-1/2 p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Previous month"
                          >
                            <ChevronLeft size={20} className="text-blue-600" />
                          </button>
                        )}
                        <div className="h-10 flex items-center justify-center font-bold text-blue-600 text-sm bg-blue-50 rounded">
                          {day}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7 gap-3">
                    {renderCalendar()}
                  </div>
                </div>

                {/* Second Month */}
                <div>
                  <h4 className="font-bold text-gray-800 text-xl text-center mb-3">
                    {monthNames[new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1).getMonth()]} {new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1).getFullYear()}
                  </h4>

                  {/* Days of week with right arrow above Sat */}
                  <div className="grid grid-cols-7 gap-3 mb-2">
                    {daysOfWeek.map((day, index) => (
                      <div key={day} className="relative">
                        {index === 6 && (
                          <button
                            onClick={handleNextMonth}
                            className="absolute -top-8 left-1/2 transform -translate-x-1/2 p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Next month"
                          >
                            <ChevronRight size={20} className="text-blue-600" />
                          </button>
                        )}
                        <div className="h-10 flex items-center justify-center font-bold text-blue-600 text-sm bg-blue-50 rounded">
                          {day}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Days of next month */}
                  <div className="grid grid-cols-7 gap-3">
                    {(() => {
                      const nextMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1);
                      const daysInNextMonth = getDaysInMonth(nextMonth);
                      const firstDayOfNext = getFirstDayOfMonth(nextMonth);
                      const days = [];

                      for (let i = 0; i < firstDayOfNext; i++) {
                        days.push(
                          <div key={`empty-${i}`} className="h-12"></div>
                        );
                      }

                      for (let day = 1; day <= daysInNextMonth; day++) {
                        const year = nextMonth.getFullYear();
                        const month = nextMonth.getMonth();
                        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                        const isStart = startDate === dateString;
                        const isEnd = endDate === dateString;
                        const inRange = (() => {
                          if (!startDate || !endDate) return false;
                          const date = new Date(year, month, day);
                          const start = new Date(startDate);
                          const end = new Date(endDate);
                          return date > start && date < end;
                        })();

                        const { bg, text, title } = getDayColorClass(year, month, day);

                        days.push(
                          <button
                            key={day}
                            onClick={() => {
                              const selectedDate = new Date(Date.UTC(year, month, day));
                              const selectedDateString = selectedDate.toISOString().split('T')[0];

                              if (!selectingEnd) {
                                onStartDateChange(selectedDateString);
                                setSelectingEnd(true);
                              } else {
                                if (selectedDateString >= startDate) {
                                  onEndDateChange(selectedDateString);
                                  setSelectingEnd(false);
                                }
                              }
                            }}
                            className={`
                          h-12 rounded-lg font-bold text-sm transition-all flex items-center justify-center
                          ${isStart || isEnd
                                ? "bg-blue-600 text-white font-bold shadow-lg"
                                : inRange
                                  ? "bg-blue-200 text-blue-900 font-semibold"
                                  : `${bg} ${text}`
                              }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                            disabled={disabled}
                            title={title}
                          >
                            {day}
                          </button>
                        );
                      }

                      return days;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Footer */}
          {startDate && endDate && (
            <div className="px-4 py-3 bg-blue-50 border-t-2 border-blue-300 rounded-b-lg">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">{formatDisplayDate(startDate)}</span> to <span className="font-semibold">{formatDisplayDate(endDate)}</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Total: <span className="font-bold">{getDayCount()} days</span></p>
                  {getDayCount() > maxDays && (
                    <p className="text-xs text-red-600 mt-2 font-semibold">
                      ⚠️ Selection exceeds {maxDays} business days. Please select fewer days.
                    </p>
                  )}
                  <button
                    onClick={() => {
                      onStartDateChange("");
                      onEndDateChange("");
                      setSelectingEnd(false);
                    }}
                    className="mt-2 px-2 py-1 text-xs bg-red-300 text-white rounded hover:bg-red-400 transition-colors font-semibold"
                  >
                    Clear
                  </button>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
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
