
import React from "react";
import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  const { isAdmin } = useAuth();
  
  return (
    <Card className="temple-card overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-temple-maroon line-clamp-2">{book.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Author:</span> {book.author}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Category:</span> {book.category}
        </p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-lg font-semibold text-temple-saffron">
            ₹{book.salePrice}
          </p>
          {isAdmin && (
            <p className="text-sm text-muted-foreground">
              Original: ₹{book.originalPrice}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center pt-2">
          <p className={`text-sm ${book.quantity < 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
            Stock: {book.quantity}
          </p>
          <Button 
            variant="default" 
            className="bg-temple-saffron hover:bg-temple-saffron/90"
            onClick={() => onSelect(book)}
          >
            {book.quantity > 0 ? "Sell" : "View"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
