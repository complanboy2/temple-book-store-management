
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  id?: string;
  mode: "single" | "range" | "multiple";
  selected?: Date | Date[] | { from: Date; to: Date };
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ 
  id, 
  mode = "single", 
  selected, 
  onSelect, 
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Handle rendering different date formats based on selection mode
  const getDateDisplay = () => {
    if (!selected) {
      return placeholder;
    }

    if (mode === "single" && selected instanceof Date) {
      return format(selected, "PPP");
    }

    if (mode === "range" && selected && typeof selected === "object" && "from" in selected) {
      return `${selected.from ? format(selected.from, "PPP") : ""}${selected.to ? ` - ${format(selected.to, "PPP")}` : ""}`;
    }

    if (mode === "multiple" && Array.isArray(selected)) {
      return `${selected.length} date${selected.length !== 1 ? "s" : ""} selected`;
    }

    return placeholder;
  };

  // This handles the type safety for different modes
  const renderCalendar = () => {
    switch (mode) {
      case "single":
        return (
          <Calendar
            mode="single"
            selected={selected as Date}
            onSelect={(date) => {
              onSelect(date);
              setIsOpen(false);
            }}
            initialFocus
          />
        );
      case "range":
        return (
          <Calendar
            mode="range"
            selected={selected as { from: Date; to: Date }}
            onSelect={(range) => {
              // Handle the range selection specially
              if (range?.from) {
                onSelect(range.from);
              } else {
                onSelect(undefined);
              }
              setIsOpen(false);
            }}
            initialFocus
          />
        );
      case "multiple":
        return (
          <Calendar
            mode="multiple"
            selected={selected as Date[]}
            onSelect={(dates) => {
              // For multiple selection, we just pass the first date if any
              if (dates && dates.length > 0) {
                onSelect(dates[0]);
              } else {
                onSelect(undefined);
              }
              setIsOpen(false);
            }}
            initialFocus
          />
        );
      default:
        return null;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getDateDisplay()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {renderCalendar()}
      </PopoverContent>
    </Popover>
  )
}
