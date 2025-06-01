
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BookFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  showLowStockOnly?: boolean;
  onToggleLowStock?: () => void;
}

const BookFilter: React.FC<BookFilterProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  showLowStockOnly = false,
  onToggleLowStock
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={t("common.searchBooks")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        {(searchTerm || selectedCategory) && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t("common.selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common.allCategories")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {onToggleLowStock && (
          <Button
            variant={showLowStockOnly ? "default" : "outline"}
            onClick={onToggleLowStock}
            className="whitespace-nowrap"
          >
            {showLowStockOnly ? "Show All" : "Low Stock"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookFilter;
