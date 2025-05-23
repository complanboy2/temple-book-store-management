
import React from "react";
import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Trash2, Edit, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import BookImage, { BookImageProps } from "@/components/BookImage";

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onDelete?: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onSell?: (book: Book) => void;
  ImageComponent?: React.FC<BookImageProps>;
}

const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  onSelect, 
  onDelete, 
  onEdit, 
  onSell,
  ImageComponent = BookImage
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const { t } = useTranslation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSell) {
      onSell(book);
    } else if (book.quantity > 0) {
      onSelect(book);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(book);
      console.log("Edit click handler called for book:", book.id, book.name);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete(book);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <AspectRatio ratio={4/3}>
          <ImageComponent 
            imageUrl={book.imageUrl} 
            alt={book.name}
            className="w-full h-full object-cover"
          />
        </AspectRatio>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2">{book.name}</CardTitle>
        <p className="text-sm text-muted-foreground mb-1">{t("common.author")}: {book.author}</p>
        <p className="text-sm text-muted-foreground mb-2">{t("common.quantity")}: {book.quantity}</p>
        <p className="font-medium text-temple-saffron mb-4 text-right">₹{book.salePrice}</p>
        
        <div className="flex flex-col gap-2">
          {/* Sell button - full width on mobile */}
          <Button 
            onClick={handleClick}
            variant="default"
            type="button"
            disabled={book.quantity <= 0}
            className="w-full bg-temple-saffron hover:bg-temple-saffron/90 text-white"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t("common.sell")}
          </Button>
          
          {/* Admin buttons - full width and larger on mobile */}
          {isAdmin && (
            <div className="flex gap-2 w-full" data-testid="admin-buttons">
              {onEdit && (
                <Button
                  onClick={handleEditClick}
                  variant="outline"
                  className="flex-1 min-h-[44px] border-temple-maroon text-temple-maroon hover:bg-temple-maroon hover:text-white touch-manipulation"
                  title={t("common.edit")}
                  type="button"
                  data-testid="edit-book-button"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t("common.edit")}
                </Button>
              )}
              
              {onDelete && (
                <Button
                  onClick={handleDeleteClick}
                  variant="outline"
                  className="flex-1 min-h-[44px] border-red-500 text-red-500 hover:bg-red-500 hover:text-white touch-manipulation"
                  title={t("common.delete")}
                  type="button"
                  data-testid="delete-book-button"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("common.delete")}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
