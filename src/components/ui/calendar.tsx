import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-72 p-3 bg-white", className)}
      classNames={{
        root: "w-full",
        months: "w-full",
        month: "w-full",
        nav: "flex justify-between items-center mb-4",
        button_previous: "h-7 w-7 text-indigo-600 hover:text-indigo-800 p-0 flex items-center justify-center hover:bg-indigo-50 rounded transition-colors",
        button_next: "h-7 w-7 text-indigo-600 hover:text-indigo-800 p-0 flex items-center justify-center hover:bg-indigo-50 rounded transition-colors",
        month_caption: "text-center mb-4",
        caption_label: "text-sm font-semibold text-gray-900",
        table: "w-full",
        weekdays: "grid grid-cols-7 gap-1 mb-2",
        weekday: "text-center text-xs font-medium text-gray-600 h-7 flex items-center justify-center",
        week: "grid grid-cols-7 gap-1",
        day: "p-0 text-center h-7 w-7",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          const Icon = orientation === "left" ? ChevronLeftIcon : ChevronRightIcon;
          return <Icon className={cn("h-4 w-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}

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
        "h-7 w-7 text-xs rounded font-medium text-gray-700 hover:bg-indigo-100",
        isSelected && "bg-indigo-600 text-white font-bold",
        isToday && !isSelected && "bg-yellow-100 border border-yellow-400 text-yellow-800",
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

export { Calendar, CalendarDayButton };
