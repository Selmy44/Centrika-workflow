"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SingleDatePickerProps {
  id?: string;
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  label?: string;
  autoClose?: boolean;
  className?: string;
}

export default function SingleDatePicker({
  id,
  value,
  onChange,
  disabled = false,
  label = "Select Date",
  autoClose = true,
  className,
}: SingleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse value to use as initial display month, or current date if no value
  const initialDate = value ? new Date(value + "T00:00:00") : new Date();
  const [displayMonth, setDisplayMonth] = useState(initialDate);

  // Sync displayMonth when value changes
  useEffect(() => {
    if (value) {
      setDisplayMonth(new Date(value + "T00:00:00"));
    }
  }, [value]);

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
    const selectedDate = new Date(Date.UTC(displayMonth.getFullYear(), displayMonth.getMonth(), day));
    const dateString = selectedDate.toISOString().split('T')[0];
    onChange(dateString);
    if (autoClose) {
      setIsOpen(false);
    }
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

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
          className={cn(
            "h-8 w-8 mx-auto rounded-md font-normal text-sm transition-all flex items-center justify-center",
            selected
              ? "bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary hover:text-primary-foreground"
              : "text-foreground hover:bg-accent hover:text-accent-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return label;
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            disabled ? "cursor-not-allowed opacity-50" : "hover:bg-transparent",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{formatDisplayDate(value)}</span>
          <CalendarIcon className="h-4 w-4 opacity-50 ml-2 shrink-0" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
          <div className="space-y-4 w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevMonth}
                className="h-7 w-7 shrink-0 bg-transparent p-0 flex items-center justify-center hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground border border-input/50"
                title="Previous Month"
                aria-label="Previous Month"
              >
                 <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                <select
                  value={displayMonth.getMonth()}
                  onChange={(e) => setDisplayMonth(new Date(displayMonth.getFullYear(), parseInt(e.target.value), 1))}
                  className="h-7 rounded-md border border-input bg-transparent px-1 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-background"
                  aria-label="Select month"
                >
                  {monthNames.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>

                <select
                  value={displayMonth.getFullYear()}
                  onChange={(e) => setDisplayMonth(new Date(parseInt(e.target.value), displayMonth.getMonth(), 1))}
                  className="h-7 rounded-md border border-input bg-transparent px-1 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-background"
                  aria-label="Select year"
                >
                  {Array.from({ length: 140 }, (_, i) => new Date().getFullYear() - 100 + i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNextMonth}
                className="h-7 w-7 shrink-0 bg-transparent p-0 flex items-center justify-center hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground border border-input/50"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar */}
            <div className="w-full">
              {/* Days of week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-muted-foreground font-normal text-[0.8rem] text-center">
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
      </PopoverContent>
    </Popover>
  );
}

