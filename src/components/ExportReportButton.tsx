import React from "react";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useTranslation } from "react-i18next";
import { BookReportData } from "@/types/reportTypes";

interface ExportReportButtonProps {
  reportType: string;
  bookData: BookReportData[];
}

const ExportReportButton: React.FC<ExportReportButtonProps> = ({ reportType, bookData }) => {
  const { t } = useTranslation();

  const handleExport = () => {
    // Step 1: Prepare the data
    const data = bookData.map(book => {
      return {
        [t("common.bookId")]: book.id,
        [t("common.bookName")]: book.name,
        [t("common.author")]: book.author,
        [t("common.price")]: book.price,
        [t("common.quantity")]: book.quantity,
        [t("common.category")]: book.category,
        [t("common.printingInstitute")]: book.printingInstitute,
        [t("common.imageUrl")]: book.imageurl,
        [t("common.quantitySold")]: book.quantitySold,
      };
    });

    // Step 2: Create a new workbook
    const wb = XLSX.utils.book_new();

    // Step 3: Convert the data to a worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Step 4: Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, reportType);

    // Step 5: Generate the Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    // Step 6: Save the file
    saveAs(fileData, `${reportType}_report.xlsx`);
  };

  return (
    <Button onClick={handleExport} className="bg-temple-saffron hover:bg-temple-saffron/90 text-white px-4 py-2 rounded flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      {t("common.export")}
    </Button>
  );
};

export default ExportReportButton;
