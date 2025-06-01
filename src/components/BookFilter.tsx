
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { Search, Filter } from "lucide-react";

interface BookFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  showLowStockOnly: boolean;
  onToggleLowStock: () => void;
}

const BookFilter: React.FC<BookFilterProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  showLowStockOnly,
  onToggleLowStock
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 mb-6">
      <div>
        <Label htmlFor="search">{t("common.searchBooks")}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="search"
            placeholder={t("common.searchByCodeNameAuthor")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="category">{t("common.filterByCategory")}</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder={t("common.selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("common.allCategories")}</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onToggleLowStock}
          variant={showLowStockOnly ? "default" : "outline"}
          className="flex-1"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showLowStockOnly ? t("common.showingLowStock") : t("common.showLowStock")}
        </Button>
      </div>
    </div>
  );
};

export default BookFilter;
