
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { CalendarDays, Download, Table } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { DatePicker } from "@/components/ui/date-picker";
import ExportSalesButton from "@/components/ExportSalesButton";

interface Sale {
  id: string;
  bookid: string;
  quantity: number;
  totalamount: number;
  createdat: string;
  buyername?: string;
  buyerphone?: string;
  paymentmethod: string;
  personnelid: string;
}

interface BookDetails {
  [key: string]: {
    name: string;
    author: string;
    category: string;
  };
}

interface PersonnelDetails {
  [key: string]: {
    name: string;
  };
}

const ReportsPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [bookDetails, setBookDetails] = useState<BookDetails>({});
  const [personnelDetails, setPersonnelDetails] = useState<PersonnelDetails>({});
  const [fromDate, setFromDate] = useState<Date>(new Date('2025-05-01'));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const { currentStore } = useStallContext();
  const { t } = useTranslation();

  const fetchSalesData = async () => {
    if (!currentStore) return;

    setIsLoading(true);
    try {
      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('stallid', currentStore)
        .gte('createdat', fromDateStr)
        .lte('createdat', toDateStr + 'T23:59:59')
        .order('createdat', { ascending: false });

      if (salesError) throw salesError;

      setSales(salesData || []);

      // Fetch book details
      const bookIds = [...new Set(salesData?.map(sale => sale.bookid))];
      if (bookIds.length > 0) {
        const { data: booksData } = await supabase
          .from('books')
          .select('id, name, author, category')
          .in('id', bookIds);

        const bookMap: BookDetails = {};
        booksData?.forEach(book => {
          bookMap[book.id] = {
            name: book.name,
            author: book.author,
            category: book.category || ''
          };
        });
        setBookDetails(bookMap);
      }

      // Fetch personnel details
      const personnelIds = [...new Set(salesData?.map(sale => sale.personnelid))];
      if (personnelIds.length > 0) {
        const { data: personnelData } = await supabase
          .from('users')
          .select('id, name')
          .in('id', personnelIds);

        const personnelMap: PersonnelDetails = {};
        personnelData?.forEach(person => {
          personnelMap[person.id] = {
            name: person.name
          };
        });
        setPersonnelDetails(personnelMap);
      }

    } catch (error) {
      console.error("Error fetching sales data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [currentStore, fromDate, toDate]);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalamount, 0);
  const totalItems = sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const uniqueBooks = new Set(sales.map(sale => sale.bookid)).size;
  const uniqueSellers = new Set(sales.map(sale => sale.personnelid)).size;

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.reports")}
        showBackButton={true}
        backTo="/"
      />
      
      <main className="container mx-auto px-4 py-6">
        {/* Date Range Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {t("reports.dateRange")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t("reports.fromDate")}</label>
                <DatePicker
                  date={fromDate}
                  onDateChange={setFromDate}
                  minDate={new Date('2025-05-01')}
                  maxDate={toDate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t("reports.toDate")}</label>
                <DatePicker
                  date={toDate}
                  onDateChange={setToDate}
                  minDate={fromDate}
                  maxDate={new Date()}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="mb-6 flex justify-end">
          <ExportSalesButton 
            sales={sales}
            bookDetails={bookDetails}
            personnelDetails={personnelDetails}
            className="bg-temple-maroon hover:bg-temple-maroon/90 text-white px-6 py-2 rounded-md flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t("common.export")}
          </ExportSalesButton>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              {t("reports.salesData")}
            </CardTitle>
            <div className="text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-2">
              <span>{t("reports.totalItems")}: <strong>{totalItems}</strong></span>
              <span>{t("reports.totalRevenue")}: <strong>₹{totalRevenue.toFixed(2)}</strong></span>
              <span>{t("reports.uniqueBooks")}: <strong>{uniqueBooks}</strong></span>
              <span>{t("reports.uniqueSellers")}: <strong>{uniqueSellers}</strong></span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">{t("common.loading")}</div>
            ) : sales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t("reports.noSalesData")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">{t("common.book")}</th>
                      <th className="text-left p-2">{t("common.seller")}</th>
                      <th className="text-left p-2">{t("common.quantity")}</th>
                      <th className="text-left p-2">{t("common.amount")}</th>
                      <th className="text-left p-2">{t("common.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr key={sale.id} className="border-b">
                        <td className="p-2">
                          <div>
                            <div className="font-medium truncate">{bookDetails[sale.bookid]?.name || t("common.unknownBook")}</div>
                            <div className="text-xs text-gray-500">{bookDetails[sale.bookid]?.author}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-sm">{personnelDetails[sale.personnelid]?.name || t("common.unknown")}</div>
                        </td>
                        <td className="p-2">{sale.quantity}</td>
                        <td className="p-2">₹{sale.totalamount.toFixed(2)}</td>
                        <td className="p-2">{new Date(sale.createdat).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ReportsPage;
