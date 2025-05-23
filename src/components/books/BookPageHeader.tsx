
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ExportReportButton from "@/components/ExportReportButton";
import { BookReportData } from "@/types/reportTypes";
import { Button } from "@/components/ui/button"; 
import { Plus } from "lucide-react";

interface BookPageHeaderProps {
  exportBooks: BookReportData[];
  isAdmin: boolean;
}

const BookPageHeader: React.FC<BookPageHeaderProps> = ({ exportBooks, isAdmin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <h1 className="text-2xl font-bold text-temple-maroon">
        {t("common.booksInventory")}
      </h1>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {/* Export Button for admins */}
        {isAdmin && (
          <ExportReportButton
            reportType="inventory"
            bookData={exportBooks}
          />
        )}
        
        {/* Add Book Button for admins */}
        {isAdmin && (
          <Button 
            onClick={() => navigate("/books/add")}
            className="bg-temple-saffron hover:bg-temple-saffron/90 text-white px-6 py-3 rounded-lg flex items-center justify-center min-h-[44px] touch-manipulation font-medium"
            data-testid="add-book-button"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t("common.addBook")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookPageHeader;
