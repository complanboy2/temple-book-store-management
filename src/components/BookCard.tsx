
import React from "react";
import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onDelete?: (bookId: string) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onSelect, onDelete }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        {book.imageUrl && (
          <AspectRatio ratio={4/3}>
            <img 
              src={book.imageUrl} 
              alt={book.name}
              className="w-full h-full object-cover"
            />
          </AspectRatio>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2">{book.name}</CardTitle>
        <p className="text-sm text-muted-foreground mb-1">Author: {book.author}</p>
        <p className="text-sm text-muted-foreground mb-2">Stock: {book.quantity}</p>
        <p className="font-medium text-temple-saffron mb-4">₹{book.salePrice}</p>
        
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => onSelect(book)}
            variant="default"
          >
            Select
          </Button>
          
          {isAdmin && onDelete && (
            <Button
              onClick={() => onDelete(book.id)}
              variant="ghost"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
