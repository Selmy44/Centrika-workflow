import * as React from "react";
import { ChevronUpIcon, ChevronDownIcon, X } from "lucide-react";
import { DayButton, DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const isSelected = modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle;
  const isToday = modifiers.today;
  const isDisabled = modifiers.disabled;
  const isOutside = modifiers.outside;

  return (
    <button
      ref={ref}
      className={cn(
        "h-10 w-10 text-sm rounded-md font-medium text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors",
        isSelected && "bg-indigo-600 text-white font-bold shadow-lg",
        isToday && !isSelected && "bg-yellow-100 border-2 border-yellow-400 text-yellow-800 font-bold",
        isOutside && "text-gray-300 cursor-default",
        isDisabled && "text-gray-300 cursor-not-allowed bg-gray-100",
        className
      )}
      {...props}
    >
      {day.date.getDate()}
    </button>
  );
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected?: Date;
  onSelect: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}

export function CalendarModal({
  isOpen,
  onClose,
  selected,
  onSelect,
  disabled,
}: CalendarModalProps) {
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const calendarRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "up" | "down") => {
    if (scrollTimeoutRef.current) return;

    if (calendarRef.current) {
      const buttons = calendarRef.current.querySelectorAll("[data-nav-button]");
      const targetButton = direction === "up" ? buttons[0] : buttons[1];

      if (targetButton) {
        (targetButton as HTMLButtonElement).click();
        scrollTimeoutRef.current = setTimeout(() => {
          scrollTimeoutRef.current = null;
        }, 600);
      }
    }
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      onSelect(date);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:w-96 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Select Date</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Container */}
          <div
            ref={calendarRef}
            className="flex flex-col items-center gap-4 p-6"
            onWheel={(e) => {
              e.preventDefault();
              if (e.deltaY < 0) handleScroll("up");
              else handleScroll("down");
            }}
          >
            {/* Scroll Up Button */}
            <button
              onClick={() => handleScroll("up")}
              className="h-8 w-8 text-indigo-600 hover:text-indigo-800 flex items-center justify-center rounded hover:bg-indigo-50 transition-colors"
            >
              <ChevronUpIcon className="h-5 w-5" />
            </button>

            {/* Calendar */}
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelectDate}
              disabled={disabled}
              showOutsideDays
              className="w-full"
              classNames={{
                root: "w-full",
                months: "w-full",
                month: "w-full",
                nav: "flex justify-center items-center mb-5",
                button_previous: "hidden",
                button_next: "hidden",
                month_caption: "text-center mb-5",
                caption_label: "text-lg font-bold text-gray-900",
                table: "w-full",
                weekdays: "grid grid-cols-7 gap-2 mb-3",
                weekday: "text-center text-xs font-bold text-indigo-600 h-10 flex items-center justify-center",
                week: "grid grid-cols-7 gap-2",
                day: "p-0 text-center h-10 w-10",
              }}
              components={{
                Chevron: ({ className, orientation, ...navProps }) => {
                  return (
                    <button
                      data-nav-button
                      type="button"
                      className="hidden"
                      {...navProps}
                    />
                  );
                },
                DayButton: CalendarDayButton,
              }}
            />

            {/* Scroll Down Button */}
            <button
              onClick={() => handleScroll("down")}
              className="h-8 w-8 text-indigo-600 hover:text-indigo-800 flex items-center justify-center rounded hover:bg-indigo-50 transition-colors"
            >
              <ChevronDownIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
