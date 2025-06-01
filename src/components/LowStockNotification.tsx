
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface Book {
  id: string;
  name: string;
  quantity: number;
}

interface LowStockNotificationProps {
  books: Book[];
}

const LowStockNotification: React.FC<LowStockNotificationProps> = ({ books }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!books || books.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-orange-600 mt-1" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-orange-900 mb-1">
              {t("common.lowStockAlert")}
            </h3>
            <p className="text-sm text-orange-800 mb-3">
              {books.length === 1 
                ? t("common.oneBookRunningLow")
                : `${books.length} ${t("common.booksRunningLow")}`
              }
            </p>
            
            {/* Show first 3 books */}
            <div className="space-y-1 mb-3">
              {books.slice(0, 3).map((book) => (
                <div key={book.id} className="flex justify-between items-center text-sm">
                  <span className="text-orange-900 truncate pr-2">{book.name}</span>
                  <span className="text-orange-700 font-medium flex-shrink-0">
                    {book.quantity} {t("common.left")}
                  </span>
                </div>
              ))}
              {books.length > 3 && (
                <p className="text-xs text-orange-700 mt-1">
                  {t("common.andMore", { count: books.length - 3 })}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/books?filter=lowStock")}
              className="w-full text-orange-800 border-orange-300 hover:bg-orange-100 hover:border-orange-400 transition-colors"
            >
              <span className="flex-1">{t("common.viewLowStockBooks")}</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LowStockNotification;
