
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import MobileHeader from "@/components/MobileHeader";
import ExportReportButton from "@/components/ExportReportButton";
import { format } from "date-fns";
import { Table } from "lucide-react";

const ReportsPage = () => {
  const [sales, setSales] = useState([]);
  const [fromDate, setFromDate] = useState<Date | null>(new Date(2025, 4, 1)); // May 1st, 2025
  const [toDate, setToDate] = useState<Date | null>(new Date());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [bookDetailsMap, setBookDetailsMap] = useState({});
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");
  const [authors, setAuthors] = useState<string[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<string>("");
  const [institutes, setInstitutes] = useState<string[]>([]);
  const [filteredSales, setFilteredSales] = useState([]);

  const { currentStore } = useStallContext();
  const { t } = useTranslation();
  const minDate = new Date(2025, 4, 1); // May 1st, 2025

  useEffect(() => {
    const fetchSalesAndCategories = async () => {
      if (!currentStore) return;

      try {
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('*')
          .eq('stallid', currentStore);

        if (salesError) {
          console.error("Error fetching sales:", salesError);
          return;
        }

        setSales(salesData || []);

        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('id, category, author, printinginstitute, name, saleprice, imageurl')
          .eq('stallid', currentStore);

        if (booksError) {
          console.error("Error fetching books:", booksError);
          return;
        }

        const uniqueCategories = new Set<string>();
        const uniqueAuthors = new Set<string>();
        const uniqueInstitutes = new Set<string>();
        const bookMap = {};

        booksData?.forEach(book => {
          if (book.category) {
            uniqueCategories.add(book.category);
          }
          if (book.author) {
            uniqueAuthors.add(book.author);
          }
          if (book.printinginstitute) {
            uniqueInstitutes.add(book.printinginstitute);
          }
          bookMap[book.id] = { 
            category: book.category,
            author: book.author,
            institute: book.printinginstitute,
            name: book.name,
            price: book.saleprice,
            imageurl: book.imageurl
          };
        });

        setCategories(Array.from(uniqueCategories));
        setAuthors(Array.from(uniqueAuthors));
        setInstitutes(Array.from(uniqueInstitutes));
        setBookDetailsMap(bookMap);
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchSalesAndCategories();
  }, [currentStore]);
  
  const generateSalesReportData = () => {
    return filteredSales.map(sale => {
      const book = bookDetailsMap[sale.bookid];
      return {
        id: sale.id,
        bookName: book?.name || 'Unknown',
        author: book?.author || 'Unknown',
        price: book?.price || 0,
        quantity: sale.quantity,
        totalAmount: sale.totalAmount,
        date: new Date(sale.createdat),
        paymentMethod: sale.paymentMethod,
        imageurl: book?.imageurl
      };
    });
  };
  
  const filterSales = () => {
    if (!sales.length) return [];
    
    const filtered = sales.filter(sale => {
      if (fromDate && toDate) {
        const saleDate = new Date(sale.createdat);
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        
        if (saleDate < from || saleDate > to) return false;
      }
      
      if (selectedCategory && bookDetailsMap[sale.bookid]) {
        if (bookDetailsMap[sale.bookid].category !== selectedCategory) return false;
      }
      
      if (selectedAuthor && bookDetailsMap[sale.bookid]) {
        if (bookDetailsMap[sale.bookid].author !== selectedAuthor) return false;
      }
      
      if (selectedInstitute && bookDetailsMap[sale.bookid]) {
        if (bookDetailsMap[sale.bookid].institute !== selectedInstitute) return false;
      }
      
      return true;
    });
    
    setFilteredSales(filtered);
    return filtered;
  };

  useEffect(() => {
    filterSales();
  }, [sales, fromDate, toDate, selectedCategory, selectedAuthor, selectedInstitute, bookDetailsMap]);

  const getTotalItems = () => filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const getTotalRevenue = () => filteredSales.reduce((sum, sale) => sum + sale.totalamount, 0);
  const getUniqueBooks = () => new Set(filteredSales.map(sale => sale.bookid)).size;

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader 
        title={t("common.salesReports")}
        showBackButton={true}
        showStallSelector={true}
      />
      
      <div className="mobile-container py-4">
        {/* Filter Controls */}
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <DatePicker
                date={fromDate}
                onDateChange={setFromDate}
                placeholder="Select from date"
                minDate={minDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <DatePicker
                date={toDate}
                onDateChange={setToDate}
                placeholder="Select to date"
                minDate={fromDate || minDate}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("common.all")}</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Export Button */}
          <div className="flex justify-center">
            <ExportReportButton 
              reportType="sales"
              salesData={generateSalesReportData()}
              dateRange={{ from: fromDate, to: toDate }}
            />
          </div>
        </div>
        
        {/* Sales Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Table className="h-5 w-5" />
              Sales Data
            </CardTitle>
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-temple-maroon">{getTotalItems()}</div>
                <div className="text-xs text-gray-600">Total Items</div>
              </div>
              <div>
                <div className="font-semibold text-temple-maroon">₹{getTotalRevenue().toLocaleString()}</div>
                <div className="text-xs text-gray-600">Total Revenue</div>
              </div>
              <div>
                <div className="font-semibold text-temple-maroon">{getUniqueBooks()}</div>
                <div className="text-xs text-gray-600">Unique Books</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">{t("common.date")}</th>
                    <th className="text-left p-2">{t("common.book")}</th>
                    <th className="text-left p-2">{t("common.quantity")}</th>
                    <th className="text-left p-2">{t("common.amount")}</th>
                    <th className="text-left p-2">{t("common.buyer")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => {
                    const book = bookDetailsMap[sale.bookid];
                    return (
                      <tr key={sale.id} className="border-b">
                        <td className="p-2">{format(new Date(sale.createdat), 'dd/MM/yyyy')}</td>
                        <td className="p-2">{book?.name || t("common.unknownBook")}</td>
                        <td className="p-2">{sale.quantity}</td>
                        <td className="p-2">₹{sale.totalamount}</td>
                        <td className="p-2">{sale.buyername || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredSales.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  {t("common.noSales")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
