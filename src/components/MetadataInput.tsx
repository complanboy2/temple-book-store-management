
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { Plus, Undo2 } from "lucide-react";

interface MetadataInputProps {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onValueChange: (value: string) => void;
  onAddNew?: (newValue: string) => void;
  showPercentage?: boolean;
  percentageValue?: number;
  onPercentageChange?: (percentage: number) => void;
}

const MetadataInput: React.FC<MetadataInputProps> = ({
  label,
  value,
  options,
  placeholder,
  onValueChange,
  onAddNew,
  showPercentage = false,
  percentageValue = 0,
  onPercentageChange
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newValue, setNewValue] = useState("");
  const { t } = useTranslation();

  const handleAddNew = () => {
    if (newValue.trim() && onAddNew) {
      onAddNew(newValue.trim());
      onValueChange(newValue.trim());
      setNewValue("");
      setIsAddingNew(false);
    }
  };

  const handleUndo = () => {
    setIsAddingNew(false);
    setNewValue("");
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value) || 0;
    if (percentage >= 0 && percentage <= 100 && onPercentageChange) {
      onPercentageChange(percentage);
    }
  };

  if (isAddingNew) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={`${t("common.new")} ${label.toLowerCase()}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddNew();
              } else if (e.key === 'Escape') {
                handleUndo();
              }
            }}
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddNew}
            disabled={!newValue.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (options.length > 0) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={value} onValueChange={onValueChange}>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {onAddNew && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        {showPercentage && value && (
          <div className="mt-2">
            <Label className="text-sm text-gray-600">
              {t("common.percentage")} (%)
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={percentageValue}
              onChange={handlePercentageChange}
              placeholder={t("placeholders.zero")}
              className="mt-1"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
};

export default MetadataInput;
