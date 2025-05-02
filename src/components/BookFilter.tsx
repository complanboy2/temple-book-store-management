
import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { Book } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BookFilterProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  selectedCategory?: string;
  setSelectedCategory?: (category: string) => void;
  categories?: string[];
  stallId?: string;
  onFilterChange?: (filteredBooks: Book[]) => void;
}

const BookFilter: React.FC<BookFilterProps> = ({
  searchTerm: externalSearchTerm,
  setSearchTerm: externalSetSearchTerm,
  selectedCategory: externalSelectedCategory,
  setSelectedCategory: externalSetSelectedCategory,
  categories: externalCategories = [],
  stallId,
  onFilterChange,
}) => {
  const { t } = useTranslation();
  
  // Internal state management if props are not provided
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [internalSelectedCategory, setInternalSelectedCategory] = useState("");
  
  // Use either external or internal state
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = externalSetSearchTerm || setInternalSearchTerm;
  const selectedCategory = externalSelectedCategory !== undefined ? externalSelectedCategory : internalSelectedCategory;
  const setSelectedCategory = externalSetSelectedCategory || setInternalSelectedCategory;
  
  const categories = externalCategories || [];

  // Handle filtering if onFilterChange is provided
  useEffect(() => {
    if (onFilterChange && stallId) {
      // This would need to actually fetch or filter books based on criteria
      // For now, it's a stub that would be implemented when used with onFilterChange
    }
  }, [searchTerm, selectedCategory, stallId, onFilterChange]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="w-full md:flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          id="searchInput"
          placeholder={t("common.searchBooks")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="temple-input pl-10 w-full"
        />
      </div>
      <Select
        value={selectedCategory}
        onValueChange={setSelectedCategory}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder={t("common.allCategories")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem key="all-categories" value="">{t("common.allCategories")}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BookFilter;
