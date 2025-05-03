
import React from "react";
import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Trash2, Edit, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onDelete?: (bookId: string) => void;
  onEdit?: (book: Book) => void;
  onSell?: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onSelect, onDelete, onEdit, onSell }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const { t } = useTranslation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSell) {
      onSell(book);
    } else {
      onSelect(book);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(book);
    }
  };

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
        <p className="text-sm text-muted-foreground mb-1">{t("common.author")}: {book.author}</p>
        <p className="text-sm text-muted-foreground mb-2">{t("common.quantity")}: {book.quantity}</p>
        <p className="font-medium text-temple-saffron mb-4 text-right">₹{book.salePrice}</p>
        
        <div className="flex justify-between items-center">
          <Button 
            onClick={handleClick}
            variant="default"
            type="button"
            disabled={book.quantity <= 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t("common.sell")}
          </Button>
          
          {isAdmin && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  onClick={handleEditClick}
                  variant="ghost"
                  className="hover:text-primary"
                  title={t("common.edit")}
                  type="button"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              
              {onDelete && (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onDelete) onDelete(book.id);
                  }}
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  title={t("common.delete")}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
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
