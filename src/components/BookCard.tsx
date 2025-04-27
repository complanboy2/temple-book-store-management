
import React from "react";
import { Book } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onDelete?: (bookId: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onSelect, onDelete }) => {
  const { isAdmin } = useAuth();
  
  const handleClick = () => {
    onSelect(book);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(book.id);
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow temple-card"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg mb-1 text-temple-maroon">{book.name}</h3>
          {isAdmin && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={handleDelete}
              title="Delete Book"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-1">{book.author}</p>
        {book.category && (
          <p className="text-xs text-muted-foreground mb-2">
            Category: {book.category}
          </p>
        )}
        <div className="flex justify-between items-center">
          <p className="font-bold text-temple-saffron">₹{book.salePrice}</p>
          <p className="text-sm text-muted-foreground">
            {book.quantity} in stock
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
