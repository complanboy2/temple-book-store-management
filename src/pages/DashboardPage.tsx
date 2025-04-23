import React, { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScannerButton from "@/components/ScannerButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";
import { BookOpen, BarChart2, PlusCircle, Search, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useStallContext } from "@/contexts/StallContext";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const storeFormSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  location: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

const DashboardPage: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [topSellingBooks, setTopSellingBooks] = useState<{ id: string, name: string, count: number }[]>([]);
  const [lowStockBooks, setLowStockBooks] = useState<any[]>([]);
  const [isAddStoreDialogOpen, setIsAddStoreDialogOpen] = useState(false);
  const [showLowStockNotification, setShowLowStockNotification] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { 
    stores, 
    currentStore, 
    setCurrentStore, 
    addStore, 
    isLoading 
  } = useStallContext();

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      location: "",
    },
  });

  useEffect(() => {
    if (!isLoading && stores.length === 0 && isAdmin) {
      console.log("No stores available, opening add store dialog");
      setIsAddStoreDialogOpen(true);
    } else if (stores.length > 0) {
      console.log("Stores available, not showing dialog:", stores);
      setIsAddStoreDialogOpen(false);
    }
  }, [stores, isLoading, isAdmin]);

  useEffect(() => {
    async function fetchBooksAndSales() {
      if (!currentStore) return;

      try {
        // Books
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("*")
          .eq("stallid", currentStore)
          .order("createdat", { ascending: false });

        if (booksError) {
          console.error("Error fetching books:", booksError);
          setBooks([]);
        } else {
          console.log(`Fetched ${booksData?.length || 0} books for store ${currentStore}`);
          setBooks(booksData || []);
        }

        // Sales
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("stallid", currentStore)
          .order("createdat", { ascending: false });

        if (salesError) {
          console.error("Error fetching sales:", salesError);
          setSales([]);
        } else {
          console.log(`Fetched ${salesData?.length || 0} sales for store ${currentStore}`);
          setSales(salesData || []);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setBooks([]);
        setSales([]);
      }
    }

    fetchBooksAndSales();
  }, [currentStore]);

  useEffect(() => {
    const revenue = sales.reduce((sum, sale) => sum + (sale.totalamount ?? 0), 0);
    setTotalRevenue(revenue);

    const lowStock = books.filter(book => (book.quantity ?? 0) < 5);
    setLowStockCount(lowStock.length);
    setLowStockBooks(lowStock);
    setShowLowStockNotification(lowStock.length > 0);

    const bookSalesMap: Record<string, { id: string, name: string, count: number }> = {};
    sales.forEach(sale => {
      const book = books.find(b => b.id === sale.bookid);
      if (book) {
        if (!bookSalesMap[book.id]) {
          bookSalesMap[book.id] = { id: book.id, name: book.name, count: 0 };
        }
        bookSalesMap[book.id].count += sale.quantity ?? 0;
      }
    });
    setTopSellingBooks(Object.values(bookSalesMap).sort((a, b) => b.count - a.count).slice(0, 3));
  }, [books, sales]);

  const handleCodeScanned = (code: string) => {
    const book = books.find(b => b.id === code || b.barcode === code);
    if (book) {
      navigate(`/sell/${book.id}`);
    } else {
      toast({
        title: "Book Not Found",
        description: t("common.bookNotFound"),
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: StoreFormValues) => {
    const success = await addStore(data.name, data.location);
    if (success) {
      setIsAddStoreDialogOpen(false);
      form.reset();
    }
  };

  const analyticsLinks = {
    books: () => navigate(`/books`),
    sales: () => navigate(`/sales?today=1`),
    revenue: () => navigate(`/sales`),
    lowStock: () => navigate(`/books?lowStock=1`),
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales.filter(
    sale => new Date(sale.createdat).getTime() >= today.getTime()
  );

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title="Temple Book Sutra"
        showBackButton={false}
        showSearchButton={true}
        showStallSelector={false}
        onSearch={() => navigate("/search")}
      />

      <div className="mobile-container flex flex-col md:flex-row md:items-center gap-2 mt-3">
        <div className="flex-1">
          {stores.length > 0 ? (
            <Select
              value={currentStore || "default-store"}
              onValueChange={(value) => setCurrentStore(value)}
            >
              <SelectTrigger className="temple-input w-full md:w-auto">
                <SelectValue placeholder={t("common.selectStore")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                      {store.location ? ` (${store.location})` : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              {isLoading ? "Loading stores..." : "No stores available"}
            </div>
          )}
        </div>
        {isAdmin && (
          <Button
            className="bg-temple-saffron hover:bg-temple-saffron/90"
            onClick={() => setIsAddStoreDialogOpen(true)}
          >
            {t("common.addStore")}
          </Button>
        )}
      </div>

      {isAddStoreDialogOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/40 z-30 flex items-center justify-center">
          <div className="bg-white p-5 rounded shadow-lg min-w-[320px]">
            <h2 className="text-lg font-semibold mb-3">{t("common.addStore")}</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.storeName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("common.storeName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.storeLocation")} ({t("common.optional")})</FormLabel>
                      <FormControl>
                        <Input placeholder={t("common.storeLocation")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 justify-end pt-2">
                  {stores.length > 0 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddStoreDialogOpen(false)}
                    >
                      {t("common.cancel")}
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    className="bg-temple-saffron hover:bg-temple-saffron/90"
                  >
                    {t("common.addStore")}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      <main className="mobile-container">
        {currentStore ? (
          <>
            {showLowStockNotification && lowStockBooks.length > 0 && (
              <div className="mb-4 p-4 rounded-lg bg-yellow-50 border-l-4 border-yellow-400 shadow-sm">
                <div className="flex items-start">
                  <AlertTriangle className="text-yellow-500 mr-3 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-yellow-800">{t("common.lowStockAlert")}</h3>
                    <div className="mt-1 space-y-1">
                      {lowStockBooks.slice(0, 3).map((book) => (
                        <p key={book.id} className="text-sm text-yellow-700">
                          <span className="font-medium">{book.name}</span>: {t("common.onlyRemaining")} <span className="font-semibold">{book.quantity}</span> {t("common.left")}
                        </p>
                      ))}
                      {lowStockBooks.length > 3 && (
                        <Button 
                          variant="link" 
                          className="text-xs text-yellow-800 p-0 h-auto" 
                          onClick={() => navigate("/books?lowStock=1")}
                        >
                          +{lowStockBooks.length - 3} {t("common.more")}...
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                tabIndex={0}
                role="button"
                onClick={analyticsLinks.books}
                className="cursor-pointer"
              >
                <StatsCard
                  title={t("dashboard.totalBooks")}
                  value={books.length}
                  icon={<BookOpen className="text-temple-maroon" size={18} />}
                />
              </div>
              <div
                tabIndex={0}
                role="button"
                onClick={analyticsLinks.sales}
                className="cursor-pointer"
              >
                <StatsCard
                  title={t("dashboard.salesToday")}
                  value={todaySales.length}
                  trend="up"
                  trendValue={`${todaySales.length > 0 ? "+" : ""}${todaySales.length}`}
                  icon={<TrendingUp className="text-temple-maroon" size={18} />}
                />
              </div>
              <div
                tabIndex={0}
                role="button"
                onClick={analyticsLinks.revenue}
                className="cursor-pointer"
              >
                <StatsCard
                  title={t("dashboard.revenue")}
                  value={`₹${totalRevenue}`}
                  icon={<BarChart2 className="text-temple-maroon" size={18} />}
                />
              </div>
              <div
                tabIndex={0}
                role="button"
                onClick={analyticsLinks.lowStock}
                className="cursor-pointer"
              >
                <StatsCard
                  title={t("dashboard.lowStock")}
                  value={lowStockCount}
                  trend={lowStockCount > 0 ? "down" : "neutral"}
                  trendValue={lowStockCount > 0 ? "Need restock" : "All good"}
                  icon={<BookOpen className="text-temple-maroon" size={18} />}
                />
              </div>
            </div>

            <div className="mb-4">
              <ScannerButton onCodeScanned={handleCodeScanned} />
            </div>

            {topSellingBooks.length > 0 && (
              <Card className="mobile-card mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-temple-maroon">{t("dashboard.topSellingBooks")}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {topSellingBooks.map((book, index) => (
                      <div
                        key={book.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-temple-gold/10 cursor-pointer"
                        onClick={() => navigate(`/sell/${book.id}`)}
                      >
                        <div className="flex items-center">
                          <div className="bg-temple-saffron/10 text-temple-saffron rounded-full w-6 h-6 flex items-center justify-center mr-3">
                            {index + 1}
                          </div>
                          <span className="font-medium">{book.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{book.count} {t("common.sold")}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="mobile-card mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-temple-maroon">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="bg-temple-saffron hover:bg-temple-saffron/90 h-auto py-3 flex flex-col items-center"
                    onClick={() => navigate("/books")}
                  >
                    <BookOpen size={24} className="mb-1" />
                    <span>View Books</span>
                  </Button>

                  <Button
                    className="bg-temple-gold hover:bg-temple-gold/90 h-auto py-3 flex flex-col items-center"
                    onClick={() => navigate("/sales")}
                  >
                    <BarChart2 size={24} className="mb-1" />
                    <span>Sales History</span>
                  </Button>

                  {isAdmin && (
                    <Button
                      className="bg-temple-maroon hover:bg-temple-maroon/90 h-auto py-3 flex flex-col items-center"
                      onClick={() => navigate("/add-book")}
                    >
                      <PlusCircle size={24} className="mb-1" />
                      <span>Add Book</span>
                    </Button>
                  )}

                  <Button
                    className="bg-gray-100 hover:bg-gray-200 text-temple-maroon h-auto py-3 flex flex-col items-center"
                    variant="outline"
                    onClick={() => navigate("/search")}
                  >
                    <Search size={24} className="mb-1" />
                    <span>Search</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="temple-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-temple-maroon">{t("dashboard.recentSales")}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {recentSales.length > 0 ? (
                  <div className="space-y-3">
                    {recentSales.map(sale => {
                      const book = books.find(b => b.id === sale.bookid);
                      return (
                        <div key={sale.id} className="flex justify-between items-center border-b border-border pb-2">
                          <div>
                            <p className="font-medium">{book?.name || "Unknown Book"}</p>
                            <p className="text-sm text-muted-foreground">
                              {t("common.quantity")}: {sale.quantity} • {new Date(sale.createdat).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="font-semibold text-temple-saffron">₹{sale.totalamount}</p>
                        </div>
                      );
                    })}

                    <Button
                      variant="outline"
                      className="w-full mt-2 text-temple-maroon border-temple-gold/20"
                      onClick={() => navigate("/sales")}
                    >
                      {t("common.viewAll")}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No sales recorded yet</p>
                    <p className="text-sm mt-1">Scan a book barcode to make a sale</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            {isLoading ? (
              <p>Loading stores...</p>
            ) : (
              <div className="space-y-4">
                <p className="text-temple-maroon font-medium">No stores available</p>
                {isAdmin && (
                  <Button 
                    className="bg-temple-saffron hover:bg-temple-saffron/90"
                    onClick={() => setIsAddStoreDialogOpen(true)}
                  >
                    Add Your First Store
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
