
import React from "react";
import { Book } from "@/types";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import BookImage, { BookImageProps } from "@/components/BookImage";
import { Loader2 } from "lucide-react";

interface BookListProps {
  books: Book[];
  isLoading?: boolean;
  searchTerm?: string;
  selectedCategory?: string;
  onBookSelect?: (book: Book) => void;
  onDeleteBook?: (bookId: string) => void;
  onClearFilters?: () => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  onSell?: (book: Book) => void;
  ImageComponent?: React.FC<BookImageProps>;
}

const BookList: React.FC<BookListProps> = ({
  books,
  isLoading = false,
  searchTerm = "",
  selectedCategory = "",
  onBookSelect,
  onDeleteBook,
  onClearFilters,
  onEdit,
  onDelete,
  onSell,
  ImageComponent = BookImage
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-temple-maroon">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg">{t("common.loading")}</p>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-temple-maroon">
        <p className="text-lg mb-4">{t("common.noBooks")}</p>
        {(searchTerm || selectedCategory) && onClearFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="mt-2 border-temple-saffron text-temple-saffron hover:bg-temple-saffron/10"
          >
            {t("common.clearFilters")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {books.map((book) => (
        <BookCard 
          key={book.id} 
          book={book} 
          onSelect={onBookSelect || (() => {})}
          onDelete={onDeleteBook ? () => onDeleteBook(book.id) : onDelete ? () => onDelete(book) : undefined}
          onEdit={onEdit ? () => onEdit(book) : undefined}
          onSell={onSell ? () => onSell(book) : undefined}
          ImageComponent={ImageComponent}
        />
      ))}
    </div>
  );
};

export default BookList;
