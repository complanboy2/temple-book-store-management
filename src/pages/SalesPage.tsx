
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sale } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import ExportSalesButton from "@/components/ExportSalesButton";
import MobileHeader from "@/components/MobileHeader";
import { Plus } from "lucide-react";
import BookImage from "@/components/BookImage";
import ExportReportButton from "@/components/ExportReportButton";

interface BookDetail {
  name: string;
  author: string;
  price: number;
  imageurl?: string;
}

interface UserDetail {
  id: string;
  name: string;
}

const SalesPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [bookDetailsMap, setBookDetailsMap] = useState<Record<string, BookDetail>>({});
  const [userDetailsMap, setUserDetailsMap] = useState<Record<string, UserDetail>>({});
  const { currentStore } = useStallContext();
  const { isAdmin, currentUser } = useAuth();
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
        
        if (dateRange.from && dateRange.to) {
          const start = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
          const end = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate() + 1);
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
          synced: sale.synced
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
  }, [currentStore, timeFilter, selectedPaymentMethod, dateRange, searchQuery, currentPage, toast, t, navigate, isAdmin]);

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!currentStore || sales.length === 0) {
        return;
      }
    
      try {
        // Get unique book IDs from sales
        const bookIds = [...new Set(sales.map(sale => sale.bookId))];
        if (bookIds.length === 0) return;
        
        const { data, error } = await supabase
          .from('books')
          .select('id, name, author, saleprice, imageurl')
          .eq('stallid', currentStore)
          .in('id', bookIds);
          
        if (error) {
          console.error("Error fetching book details:", error);
          return;
        }
        
        const details: Record<string, BookDetail> = {};
        
        // Only process if data exists and is an array
        if (data && Array.isArray(data)) {
          data.forEach(book => {
            if (book) {
              details[book.id] = {
                name: book.name || "Unknown",
                author: book.author || "",
                price: book.saleprice || 0,
                imageurl: book.imageurl // Use imageurl (lowercase) from the database
              };
            }
          });
        }
        
        setBookDetailsMap(details);
      } catch (error) {
        console.error("Unexpected error fetching book details:", error);
      }
    };
    
    fetchBookDetails();
  }, [currentStore, sales]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentStore || sales.length === 0) {
        return;
      }

      try {
        // Get unique user IDs from sales
        const userIds = [...new Set(sales.map(sale => sale.personnelId))];
        if (userIds.length === 0) return;
        
        const { data, error } = await supabase
          .from('users')
          .select('id, name')
          .in('id', userIds);
          
        if (error) {
          console.error("Error fetching user details:", error);
          return;
        }
        
        const details: Record<string, UserDetail> = {};
        
        if (data && Array.isArray(data)) {
          data.forEach(user => {
            if (user) {
              details[user.id] = {
                id: user.id,
                name: user.name || "Unknown User"
              };
            }
          });
        }
        
        setUserDetailsMap(details);
      } catch (error) {
        console.error("Unexpected error fetching user details:", error);
      }
    };
    
    fetchUserDetails();
  }, [currentStore, sales]);

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

  // Make sure we don't have empty payment methods
  const paymentMethods = Array.from(
    new Set(sales.filter(sale => sale.paymentMethod).map(sale => sale.paymentMethod))
  );

  const handleDateRangeChange = (range: { from: Date | null; to: Date | null }) => {
    setDateRange(range);
  };

  // Prepare data for export
  const getExportSalesData = () => {
    return filteredSales.map(sale => {
      const bookDetails = bookDetailsMap[sale.bookId] || { name: "Unknown", author: "Unknown", price: 0 };
      const userDetails = userDetailsMap[sale.personnelId] || { id: "", name: "Unknown User" };
      
      return {
        id: sale.id,
        bookName: bookDetails.name,
        author: bookDetails.author,
        price: bookDetails.price,
        quantity: sale.quantity,
        totalAmount: sale.totalAmount,
        date: sale.createdAt,
        buyerName: sale.buyerName,
        sellerName: userDetails.name,
        paymentMethod: sale.paymentMethod,
        imageurl: bookDetails.imageurl
      };
    });
  };

  const navigateToNewSale = () => {
    navigate('/sell/new');
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.sales")} 
        showBackButton={true} 
        backTo="/" 
        showStallSelector={true}
      />
      
      <main className="container mx-auto px-4 py-6 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">
            {t("common.salesHistory")}
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="default" 
              className="flex items-center gap-2"
              onClick={navigateToNewSale}
            >
              <Plus className="h-4 w-4" />
              {t("sell.newSale")}
            </Button>
            
            {/* Add Export Report Button for admins */}
            {isAdmin && (
              <ExportReportButton 
                reportType="sales"
                salesData={getExportSalesData()}
                dateRange={dateRange}
              />
            )}
            
            <ExportSalesButton 
              sales={sales} 
              bookDetailsMap={bookDetailsMap} 
              variant="both"
            />
          </div>
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
            <SelectTrigger>
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
            <SelectTrigger>
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
        
        <div className="mb-4">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
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
                    <TableHead>{t("common.buyer")}</TableHead>
                    <TableHead>{t("common.seller")}</TableHead>
                    <TableHead>{t("common.quantity")}</TableHead>
                    <TableHead className="text-right">{t("common.amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map(sale => {
                    const bookDetails = bookDetailsMap[sale.bookId];
                    const userDetails = userDetailsMap[sale.personnelId];
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {bookDetails && (
                              <BookImage 
                                imageUrl={bookDetails.imageurl}
                                alt={bookDetails.name || "Book"}
                                className="w-10 h-10 rounded"
                              />
                            )}
                            <span>{bookDetails?.name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{sale.buyerName || "N/A"}</TableCell>
                        <TableCell>{userDetails?.name || "N/A"}</TableCell>
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
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    aria-disabled={currentPage === totalPages}
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
