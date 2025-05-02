
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
  onEdit?: () => void;
  onSell?: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onSelect, onDelete, onEdit, onSell }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const { t } = useTranslation();

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
        <p className="font-medium text-temple-saffron mb-4">₹{book.salePrice}</p>
        
        <div className="flex justify-between items-center">
          <Button 
            onClick={() => onSell ? onSell() : onSelect(book)}
            variant="default"
          >
            {onSell ? t("common.sell") : t("common.select")}
          </Button>
          
          <div className="flex gap-2">
            {isAdmin && onEdit && (
              <Button
                onClick={onEdit}
                variant="ghost"
                className="hover:text-primary"
                title={t("common.edit")}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            
            {isAdmin && onDelete && (
              <Button
                onClick={() => onDelete(book.id)}
                variant="ghost"
                className="text-destructive hover:text-destructive"
                title={t("common.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
