
import React, { useEffect, useState } from "react";
import { Book, Sale } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import MobileHeader from "@/components/MobileHeader";
import { useStallContext } from "@/contexts/StallContext";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { currentStore } = useStallContext();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchSalesAndBooks = async () => {
      if (!currentStore) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch sales for current store
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("stallid", currentStore)
          .order("createdat", { ascending: false });

        if (salesError) {
          console.error("Error fetching sales:", salesError);
          toast({
            title: "Error",
            description: "Failed to fetch sales data",
            variant: "destructive",
          });
          setSales([]);
          setIsLoading(false);
          return;
        }
        
        // Transform to local Sale type
        const salesResult = salesData?.map(sale => ({
          id: sale.id,
          bookId: sale.bookid,
          quantity: sale.quantity,
          totalAmount: sale.totalamount,
          paymentMethod: sale.paymentmethod,
          buyerName: sale.buyername || undefined,
          buyerPhone: sale.buyerphone || undefined,
          personnelId: sale.personnelid,
          stallId: sale.stallid,
          createdAt: new Date(sale.createdat),
          synced: sale.synced
        })) || [];
        
        setSales(salesResult);
        
        // Fetch books for current store
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("*")
          .eq("stallid", currentStore);

        if (booksError) {
          console.error("Error fetching books:", booksError);
          setBooks([]);
        } else {
          // Transform to local Book type
          const booksResult = booksData?.map(book => ({
            id: book.id,
            barcode: book.barcode || undefined,
            name: book.name,
            author: book.author,
            category: book.category || "",
            printingInstitute: book.printinginstitute || "",
            originalPrice: book.originalprice,
            salePrice: book.saleprice,
            quantity: book.quantity,
            stallId: book.stallid,
            createdAt: new Date(book.createdat),
            updatedAt: new Date(book.updatedat)
          })) || [];
          
          setBooks(booksResult);
        }
        
        // Calculate total revenue
        const total = salesResult.reduce((sum, sale) => sum + sale.totalAmount, 0);
        setTotalRevenue(total);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Something went wrong while fetching data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesAndBooks();
  }, [currentStore]);

  const getFilteredSales = () => {
    let filtered = sales;
    if (search.trim()) {
      filtered = filtered.filter(sale => {
        const book = books.find(b => b.id === sale.bookId);
        return (
          (book?.name?.toLowerCase().includes(search.toLowerCase())) ||
          (book?.author?.toLowerCase().includes(search.toLowerCase())) ||
          (sale.buyerName?.toLowerCase().includes(search.toLowerCase())) ||
          (sale.personnelId?.toLowerCase().includes(search.toLowerCase()))
        );
      });
    }
    const now = new Date();
    switch (selectedPeriod) {
      case "today": {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return filtered.filter(sale => sale.createdAt >= startOfDay);
      }
      case "week": {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return filtered.filter(sale => sale.createdAt >= startOfWeek);
      }
      case "month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return filtered.filter(sale => sale.createdAt >= startOfMonth);
      }
      default:
        return filtered;
    }
  };

  const filteredSales = getFilteredSales();
  const filteredRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  const sortedSales = [...filteredSales].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader 
        title={t("common.sales")}
        showBackButton={true}
        backTo="/"
        showSearchButton={true}
        onSearch={() => document.getElementById('salesSearchInput')?.focus()}
      />
      
      <main className="container mx-auto px-2 py-4">
        {!isMobile && (
          <h1 className="text-2xl font-bold text-temple-maroon mb-4">{t("common.sales")}</h1>
        )}
        
        <div className="flex gap-2 mb-4">
          <Input
            id="salesSearchInput"
            placeholder={t("common.search")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="temple-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{t("common.totalAmount")}</p>
                <p className="text-3xl font-bold text-temple-maroon">₹{filteredRevenue}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredSales.length} sales in selected period
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="temple-card">
            <CardContent className="pt-6">
              <Tabs defaultValue="all" onValueChange={setSelectedPeriod}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="all">All Time</TabsTrigger>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="week">This Week</TabsTrigger>
                  <TabsTrigger value="month">This Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <Card className="temple-card">
          <CardHeader>
            <CardTitle className="text-lg text-temple-maroon">Sales Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>{t("common.loading")}...</p>
              </div>
            ) : sortedSales.length > 0 ? (
              <div className="space-y-4">
                {sortedSales.map(sale => {
                  const book = books.find(b => b.id === sale.bookId);
                  return (
                    <div key={sale.id} className="p-4 border rounded-lg bg-white/50">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{book?.name || "Unknown Book"}</h3>
                          <div className="flex flex-col md:flex-row md:space-x-4">
                            <p className="text-sm text-muted-foreground">
                              {t("common.quantity")}: {sale.quantity}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t("common.paymentMethod")}: {sale.paymentMethod.toUpperCase()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {sale.createdAt.toLocaleString()}
                            </p>
                          </div>
                          {sale.buyerName && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {t("common.buyerName")}: {sale.buyerName} {sale.buyerPhone && `(${sale.buyerPhone})`}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 md:mt-0">
                          <p className="font-bold text-temple-saffron text-lg">₹{sale.totalAmount}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">No sales found for the selected period.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SalesPage;
