
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  if (books.length === 0) return null;

  const lowestStockBooks = books.slice(0, 3);
  const remainingCount = books.length - 3;

  return (
    <Card className="border-l-4 border-l-orange-500 bg-orange-50 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="bg-orange-200 p-1.5 rounded-full">
            <AlertTriangle className="h-4 w-4 text-orange-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-orange-800 text-sm mb-2">
              {t("common.lowStockAlert")}
            </h3>
            <div className="space-y-1.5">
              {lowestStockBooks.map((book) => (
                <div key={book.id} className="flex justify-between items-center">
                  <span className="text-xs text-orange-700 font-medium truncate flex-1 mr-2">
                    {book.name}
                  </span>
                  <span className="text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded-full font-medium">
                    {book.quantity} {t("common.left")}
                  </span>
                </div>
              ))}
              {remainingCount > 0 && (
                <p className="text-xs text-orange-600 font-medium">
                  {t("common.andMore", { count: remainingCount })}
                </p>
              )}
            </div>
            <p className="text-xs text-orange-600 mt-2 font-medium">
              {t("common.tapToView")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LowStockNotification;
