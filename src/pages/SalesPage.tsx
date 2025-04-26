
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { DatePicker } from "@/components/ui/date-picker";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sale, Book } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import ExportSalesButton from "@/components/ExportSalesButton";

const SalesPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [bookDetailsMap, setBookDetailsMap] = useState<Record<string, { name: string; author: string; price: number }>>({});
  const { currentStore } = useStallContext();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    
    const fetchSales = async () => {
      setIsLoading(true);
      
      if (!currentStore) {
        setSales([]);
        setIsLoading(false);
        return;
      }
      
      try {
        let query = supabase
          .from("sales")
          .select("*")
          .eq("stallid", currentStore)
          .order('createdat', { ascending: false });
          
        if (timeFilter !== "all") {
          const now = new Date();
          let startDateFilter: Date;
          
          if (timeFilter === "today") {
            startDateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          } else if (timeFilter === "week") {
            const dayOfWeek = now.getDay();
            startDateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
          } else if (timeFilter === "month") {
            startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
          } else {
            startDateFilter = new Date(now.getFullYear(), 0, 1);
          }
          
          query = query.gte('createdat', startDateFilter.toISOString());
        }
        
        if (selectedPaymentMethod) {
          query = query.eq('paymentmethod', selectedPaymentMethod);
        }
        
        if (startDate && endDate) {
          const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1);
          query = query.gte('createdat', start.toISOString()).lte('createdat', end.toISOString());
        }
        
        const { data, error, count } = await query
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
          
        if (error) {
          console.error("Error fetching sales:", error);
          toast({
            title: "Error",
            description: "Failed to load sales data",
            variant: "destructive",
          });
          setSales([]);
          setIsLoading(false);
          return;
        }
        
        if (count !== null) {
          setTotalPages(Math.ceil(count / itemsPerPage));
        } else {
          // If count is null, estimate total pages based on the number of items returned
          setTotalPages(data ? Math.ceil(data.length / itemsPerPage) : 1);
        }
        
        const salesData: Sale[] = data.map(sale => ({
          id: sale.id,
          bookId: sale.bookid,
          quantity: sale.quantity,
          totalAmount: sale.totalamount,
          paymentMethod: sale.paymentmethod,
          buyerName: sale.buyername || "",
          buyerPhone: sale.buyerphone || "",
          personnelId: sale.personnelid,
          stallId: sale.stallid,
          createdAt: new Date(sale.createdat),
          synced: sale.synced // Added synced property
        }));
        
        setSales(salesData);
        setIsLoading(false);
      } catch (error) {
        console.error("Unexpected error fetching sales:", error);
        toast({
          title: "Error",
          description: "Unexpected error fetching sales data",
          variant: "destructive",
        });
        setSales([]);
        setIsLoading(false);
      }
    };
    
    fetchSales();
  }, [currentStore, timeFilter, selectedPaymentMethod, startDate, endDate, searchQuery, currentPage, toast, t, navigate, isAdmin]);

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!currentStore) {
        return;
      }
    
      try {
        const { data, error } = await supabase
          .from('books')
          .select('id, name, author, saleprice')
          .eq('stallid', currentStore);
          
        if (error) {
          console.error("Error fetching book details:", error);
          return;
        }
        
        const details: Record<string, { name: string; author: string; price: number }> = {};
        data.forEach(book => {
          details[book.id] = {
            name: book.name,
            author: book.author,
            price: book.saleprice
          };
        });
        
        setBookDetailsMap(details);
      } catch (error) {
        console.error("Unexpected error fetching book details:", error);
      }
    };
    
    fetchBookDetails();
  }, [currentStore]);

  const filteredSales = searchQuery
    ? sales.filter(sale => {
        const bookDetails = bookDetailsMap[sale.bookId];
        if (!bookDetails) return false;
        return (
          bookDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookDetails.author.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : sales;

  const paymentMethods = Array.from(new Set(sales.map(sale => sale.paymentMethod)));

  return (
    <div className="min-h-screen bg-temple-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">
            {t("common.salesHistory")}
          </h1>
          
          {/* Add Export Sales Button here */}
          <ExportSalesButton 
            sales={sales} 
            bookDetailsMap={bookDetailsMap} 
            variant="both"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            type="text"
            placeholder={t("common.searchBooks")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="temple-input"
          />
          
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="temple-select">
              <SelectValue placeholder={t("common.timeFilter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allTime")}</SelectItem>
              <SelectItem value="today">{t("common.today")}</SelectItem>
              <SelectItem value="week">{t("common.thisWeek")}</SelectItem>
              <SelectItem value="month">{t("common.thisMonth")}</SelectItem>
              <SelectItem value="year">{t("common.thisYear")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
            <SelectTrigger className="temple-select">
              <SelectValue placeholder={t("common.paymentMethod")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("common.all")}</SelectItem>
              {paymentMethods.map(method => (
                <SelectItem key={method} value={method}>{method}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2 mb-4">
          <DatePicker
            id="start-date"
            mode="single"
            placeholder={t("common.startDate")}
            selected={startDate}
            onSelect={setStartDate}
          />
          <DatePicker
            id="end-date"
            mode="single"
            placeholder={t("common.endDate")}
            selected={endDate}
            onSelect={setEndDate}
          />
        </div>
        
        <Card className="temple-card overflow-x-auto">
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : filteredSales.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("common.book")}</TableHead>
                    <TableHead>{t("common.quantity")}</TableHead>
                    <TableHead className="text-right">{t("common.amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map(sale => {
                    const bookDetails = bookDetailsMap[sale.bookId];
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>{bookDetails?.name || "Unknown"}</TableCell>
                        <TableCell>{sale.quantity}</TableCell>
                        <TableCell className="text-right">₹{sale.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4">{t("common.noSales")}</div>
            )}
          </CardContent>
        </Card>
        
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>
    </div>
  );
};

export default SalesPage;
