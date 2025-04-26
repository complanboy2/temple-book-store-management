
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sale, Book } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";
import ExportSalesButton from "@/components/ExportSalesButton";

const SalesPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [books, setBooks] = useState<Record<string, Book>>({});
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  const { currentUser } = useAuth();
  const { currentStore } = useStallContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Book details map for export
  const [bookDetailsMap, setBookDetailsMap] = useState<Record<string, { name: string; author: string; price: number }>>({});

  // Fetch sales data
  useEffect(() => {
    const fetchSalesAndBooks = async () => {
      if (!currentStore) {
        console.log("No store selected");
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Fetch books first
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("id, name, author, saleprice")
          .eq("stallid", currentStore);
        
        if (booksError) {
          console.error("Error fetching books:", booksError);
          throw booksError;
        }
        
        // Create a record of books by ID
        const booksRecord: Record<string, Book> = {};
        const bookDetails: Record<string, { name: string; author: string; price: number }> = {};
        
        if (booksData) {
          booksData.forEach((book: any) => {
            booksRecord[book.id] = book as Book;
            bookDetails[book.id] = {
              name: book.name,
              author: book.author,
              price: book.saleprice
            };
          });
        }
        
        setBooks(booksRecord);
        setBookDetailsMap(bookDetails);
        
        // Then fetch sales
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("stallid", currentStore)
          .order("createdat", { ascending: false });
        
        if (salesError) {
          console.error("Error fetching sales:", salesError);
          throw salesError;
        }
        
        if (salesData) {
          const salesWithDates = salesData.map((sale: any) => ({
            ...sale,
            createdAt: new Date(sale.createdat)
          }));
          
          setSales(salesWithDates);
          setFilteredSales(salesWithDates);
        }
      } catch (error) {
        console.error("Error in fetchSalesAndBooks:", error);
        toast({
          title: "Error",
          description: "Failed to load sales data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSalesAndBooks();
  }, [currentStore, toast, t]);
  
  // Apply filters
  useEffect(() => {
    let filtered = sales;
    
    // Filter by period
    if (activeTab === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(sale => 
        new Date(sale.createdAt) >= today
      );
    } else if (activeTab === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(sale => 
        new Date(sale.createdAt) >= weekAgo
      );
    } else if (activeTab === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(sale => 
        new Date(sale.createdAt) >= monthAgo
      );
    }
    
    // Filter by specific date
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= startOfDay && saleDate <= endOfDay;
      });
    }
    
    // Filter by payment method
    if (selectedPaymentMethod) {
      filtered = filtered.filter(sale => 
        sale.paymentMethod.toLowerCase() === selectedPaymentMethod.toLowerCase()
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(sale => {
        const bookName = books[sale.bookId]?.name.toLowerCase() || "";
        const bookAuthor = books[sale.bookId]?.author.toLowerCase() || "";
        const buyerName = sale.buyerName?.toLowerCase() || "";
        const buyerPhone = sale.buyerPhone?.toLowerCase() || "";
        
        return bookName.includes(searchTerm.toLowerCase()) || 
               bookAuthor.includes(searchTerm.toLowerCase()) ||
               buyerName.includes(searchTerm.toLowerCase()) ||
               buyerPhone.includes(searchTerm.toLowerCase());
      });
    }
    
    setFilteredSales(filtered);
  }, [sales, activeTab, selectedDate, selectedPaymentMethod, searchTerm, books]);
  
  // Calculate summary values
  const totalSales = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalItems = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
  
  // Get unique payment methods
  const paymentMethods = Array.from(new Set(sales.map(sale => sale.paymentMethod))).sort();
  
  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.salesHistory")}
        showBackButton={true}
        backTo="/"
        showStallSelector={true}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">{t("common.salesHistory")}</h1>
          
          <ExportSalesButton
            sales={filteredSales}
            bookDetailsMap={bookDetailsMap}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("common.totalSales")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalSales}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("common.itemsSold")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalItems}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("common.totalRevenue")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">{t("common.allTime")}</TabsTrigger>
              <TabsTrigger value="today">{t("common.today")}</TabsTrigger>
              <TabsTrigger value="week">{t("common.thisWeek")}</TabsTrigger>
              <TabsTrigger value="month">{t("common.thisMonth")}</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.searchSales")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : t("common.pickADate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Select
              value={selectedPaymentMethod}
              onValueChange={setSelectedPaymentMethod}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder={t("common.paymentMethod")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("common.allPaymentMethods")}</SelectItem>
                {paymentMethods.map(method => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(searchTerm || selectedDate || selectedPaymentMethod || activeTab !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDate(undefined);
                  setSelectedPaymentMethod("");
                  setActiveTab("all");
                }}
              >
                {t("common.clearFilters")}
              </Button>
            )}
          </div>
        </div>
        
        {/* Sales table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("common.book")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.quantity")}</TableHead>
                  <TableHead>{t("common.amount")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.paymentMethod")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.buyer")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      {t("common.loading")}...
                    </TableCell>
                  </TableRow>
                ) : filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{books[sale.bookId]?.name || t("common.unknownBook")}</p>
                          <p className="text-sm text-muted-foreground">{books[sale.bookId]?.author}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {sale.quantity}
                      </TableCell>
                      <TableCell>
                        ₹{sale.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {sale.paymentMethod}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {sale.buyerName || t("common.anonymous")}
                        {sale.buyerPhone && <span className="block text-sm text-muted-foreground">{sale.buyerPhone}</span>}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      {t("common.noSalesFound")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SalesPage;
