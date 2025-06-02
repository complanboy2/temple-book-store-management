
import React from "react";
import { Book } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import BookImage from "@/components/BookImage";

interface BookCardProps {
  book: Book;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  onSell?: (book: Book) => void;
  showActions?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  onEdit,
  onDelete,
  onSell,
  showActions = true,
}) => {
  const { t } = useTranslation();

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { text: t("common.outOfStock"), variant: "destructive" as const };
    if (quantity < 5) return { text: t("common.lowStock"), variant: "secondary" as const };
    return { text: t("common.inStock"), variant: "default" as const };
  };

  const stockStatus = getStockStatus(book.quantity);

  const handleEdit = () => {
    console.log("Edit clicked for book:", book.id, book.name);
    if (onEdit) {
      onEdit(book);
    }
  };

  const handleSell = () => {
    console.log("Sell clicked for book:", book.id, book.name);
    if (onSell) {
      onSell(book);
    }
  };

  const handleDelete = () => {
    console.log("Delete clicked for book:", book.id, book.name);
    if (onDelete) {
      onDelete(book);
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-16 h-20 flex-shrink-0">
          <BookImage
            imageUrl={book.imageUrl}
            alt={`${book.name} cover`}
            size="small"
            className="w-full h-full"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">{book.name}</h3>
          <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Only show sale price */}
              <span className="text-sm font-medium">₹{book.salePrice}</span>
            </div>
            <Badge 
              variant={stockStatus.variant}
              className="text-xs px-2 py-1 font-semibold"
            >
              {book.quantity} {t("common.inStock")}
            </Badge>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSell}
            disabled={book.quantity === 0}
            className="flex-1 text-xs h-8"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            {t("common.sell")} ₹{book.salePrice}
          </Button>
          
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="px-2 h-8"
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="px-2 text-destructive hover:text-destructive h-8"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default BookCard;
