
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
import { useTranslation } from "react-i18next";

interface DatePickerProps {
  id?: string;
  placeholder?: string;
  mode?: "single" | "range" | "multiple"; 
  selected?: Date | Date[] | { from: Date; to: Date };
  onSelect?: (date: Date | Date[] | { from: Date; to: Date } | undefined) => void;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  id,
  placeholder,
  mode = "single",
  selected,
  onSelect,
  className,
  disabled = false,
}: DatePickerProps) {
  const { t } = useTranslation();
  
  // Default placeholder text if none provided
  const placeholderText = placeholder || t("common.selectDate");

  return (
    <div className={cn("relative", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? (
              mode === "single" && selected instanceof Date ? (
                format(selected, "PPP")
              ) : mode === "range" && selected && typeof selected === "object" && "from" in selected ? (
                <>
                  {selected.from && format(selected.from, "PPP")}
                  {selected.to ? ` - ${format(selected.to, "PPP")}` : ""}
                </>
              ) : mode === "multiple" && Array.isArray(selected) ? (
                `${selected.length} ${
                  selected.length === 1 ? t("common.day") : t("common.days")
                } ${t("common.selected")}`
              ) : (
                placeholderText
              )
            ) : (
              placeholderText
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {mode === "single" && (
            <Calendar
              mode="single"
              selected={selected as Date}
              onSelect={onSelect as (date: Date | undefined) => void}
              initialFocus
              className="rounded-md border"
            />
          )}
          {mode === "range" && (
            <Calendar
              mode="range"
              selected={selected as { from: Date; to: Date }}
              onSelect={onSelect as (date: { from: Date; to: Date } | undefined) => void}
              initialFocus
              className="rounded-md border"
            />
          )}
          {mode === "multiple" && (
            <Calendar
              mode="multiple"
              selected={selected as Date[]}
              onSelect={onSelect as (date: Date[] | undefined) => void}
              initialFocus
              className="rounded-md border"
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
