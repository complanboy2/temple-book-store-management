
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ExportReportButton from "@/components/ExportReportButton";
import { Book } from "@/types";

interface BookPageHeaderProps {
  exportBooks: Book[];
  isAdmin: boolean;
}

const BookPageHeader: React.FC<BookPageHeaderProps> = ({ exportBooks, isAdmin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">
        {t("common.booksInventory")}
      </h1>
      
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Add Export Button for admins */}
        {isAdmin && (
          <ExportReportButton
            reportType="inventory"
            bookData={exportBooks}
          />
        )}
        
        {isAdmin && (
          <button 
            onClick={() => navigate("/books/add")}
            className="bg-temple-saffron hover:bg-temple-saffron/90 text-white px-4 py-2 rounded flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {t("common.addBook")}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookPageHeader;
