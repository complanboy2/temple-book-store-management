
import React from "react";
import BookList from "@/components/BookList";
import BookFilter from "@/components/BookFilter";
import { Book } from "@/types";

interface BookListContainerProps {
  books: Book[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  showLowStockOnly: boolean;
  onToggleLowStock: () => void;
  clearFilters: () => void;
  handleEditBook: (book: Book) => void;
  handleDeleteBook: (book: Book) => void;
  handleSellBook: (book: Book) => void;
}

const BookListContainer: React.FC<BookListContainerProps> = ({
  books,
  isLoading,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  showLowStockOnly,
  onToggleLowStock,
  clearFilters,
  handleEditBook,
  handleDeleteBook,
  handleSellBook
}) => {
  return (
    <>
      <div className="mb-6">
        <BookFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          showLowStockOnly={showLowStockOnly}
          onToggleLowStock={onToggleLowStock}
        />
      </div>
      
      <BookList 
        books={books}
        isLoading={isLoading}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        onClearFilters={clearFilters}
        onEdit={handleEditBook}
        onDelete={handleDeleteBook}
        onSell={handleSellBook}
      />
    </>
  );
};

export default BookListContainer;
