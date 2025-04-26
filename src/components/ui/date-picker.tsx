
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  id?: string;
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  mode?: "single" | "range" | "multiple";
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  id,
  selected,
  onSelect,
  mode = "single",
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {mode === "single" && (
          <Calendar
            mode="single"
            selected={selected}
            onSelect={onSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        )}
        {mode === "range" && (
          <Calendar
            mode="range"
            selected={{
              from: selected,
              to: selected,
            }}
            onSelect={(range) => {
              onSelect(range?.from);
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        )}
        {mode === "multiple" && (
          <Calendar
            mode="multiple"
            selected={selected ? [selected] : []}
            onSelect={(dates) => {
              if (dates && dates.length > 0) {
                onSelect(dates[dates.length - 1]);
              } else {
                onSelect(undefined);
              }
            }}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
