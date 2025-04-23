
import React from "react";
import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onSelect }) => {
  const { isAdmin } = useAuth();

  // Default placeholder image
  const placeholderImage = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=400&fit=crop";
  
  return (
    <Card className="temple-card overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-temple-maroon line-clamp-2">{book.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        {/* Book Image */}
        <div className="mb-3 rounded-md overflow-hidden bg-gray-100">
          <AspectRatio ratio={3/4} className="bg-muted">
            <img 
              src={book.imageUrl || placeholderImage} 
              alt={book.name}
              className="object-cover w-full h-full rounded-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = placeholderImage;
              }}
            />
          </AspectRatio>
        </div>
        
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
        <div className="flex justify-between items-center pt-2 mt-auto">
          <p className={`text-sm ${book.quantity < 5 ? 'text-destructive' : 'text-muted-foreground'}`}>
            Stock: {book.quantity}
          </p>
          <Button 
            variant="default" 
            className="bg-temple-saffron hover:bg-temple-saffron/90"
            onClick={() => onSelect(book)}
            disabled={book.quantity <= 0}
          >
            {book.quantity > 0 ? "Sell" : "Out of Stock"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
