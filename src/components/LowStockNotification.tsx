
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
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
    <Card className="p-4 border-orange-200 bg-orange-50">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-orange-800">
            {t("common.lowStockAlert")}
          </h3>
          <p className="text-sm text-orange-700 mt-1">
            {books.length} {t("common.booksRunningLow")}
          </p>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/books?lowStock=true")}
              className="text-orange-700 border-orange-300 hover:bg-orange-100"
            >
              {t("common.viewLowStockBooks")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LowStockNotification;
