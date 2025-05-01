
import React from "react";
import { Book } from "@/types";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface BookListProps {
  books: Book[];
  isLoading: boolean;
  searchTerm: string;
  selectedCategory: string;
  onBookSelect: (book: Book) => void;
  onDeleteBook?: (bookId: string) => void;
  onClearFilters: () => void;
}

const BookList: React.FC<BookListProps> = ({
  books,
  isLoading,
  searchTerm,
  selectedCategory,
  onBookSelect,
  onDeleteBook,
  onClearFilters,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">{t("common.loading")}...</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">{t("common.noBooks")}</p>
        {(searchTerm || selectedCategory) && (
          <Button
            onClick={onClearFilters}
            variant="link"
            className="mt-2 text-temple-saffron"
          >
            {t("common.clearFilters")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {books.map((book) => (
        <BookCard 
          key={book.id} 
          book={book} 
          onSelect={onBookSelect}
          onDelete={onDeleteBook}
        />
      ))}
    </div>
  );
};

export default BookList;
