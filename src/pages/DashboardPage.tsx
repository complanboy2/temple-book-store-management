
import React, { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScannerButton from "@/components/ScannerButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";
import { BookOpen, BarChart2, PlusCircle, Search, TrendingUp, AlertTriangle, Menu } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
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
  const [lowStockCount, setLowStockCount] = useState(0);
  const [topSellingBooks, setTopSellingBooks] = useState<{ id: string, name: string, count: number }[]>([]);
  const [lowStockBooks, setLowStockBooks] = useState<any[]>([]);
  const [isAddStoreDialogOpen, setIsAddStoreDialogOpen] = useState(false);
  const [showLowStockNotification, setShowLowStockNotification] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, currentUser } = useAuth();
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

  // Only show add store dialog if loading is complete, user is admin, and no stores exist
  useEffect(() => {
    if (!isLoading && stores.length === 0 && isAdmin && currentUser?.id) {
      console.log("No stores available for admin user, showing add store dialog");
      setIsAddStoreDialogOpen(true);
    } else if (stores.length > 0) {
      console.log("Stores available, hiding dialog:", stores);
      setIsAddStoreDialogOpen(false);
    } else if (!isAdmin) {
      console.log("User is not admin, not showing add store dialog");
      setIsAddStoreDialogOpen(false);
    }
  }, [stores, isLoading, isAdmin, currentUser?.id]);

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

        // Sales - Make sure we're getting all columns needed
        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("stallid", currentStore)
          .order("createdat", { ascending: false });

        if (salesError) {
          console.error("Error fetching sales:", salesError);
          setSales([]);
        } else {
          console.log(`Fetched ${salesData?.length || 0} sales for store ${currentStore}`, salesData);
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
    // Calculate low stock books
    const lowStock = books.filter(book => (book.quantity ?? 0) < 5);
    setLowStockCount(lowStock.length);
    setLowStockBooks(lowStock);
    setShowLowStockNotification(lowStock.length > 0);

    // Calculate top selling books
    const bookSalesMap: Record<string, { id: string, name: string, count: number }> = {};
    
    sales.forEach(sale => {
      if (!sale.bookid) return;
      
      const book = books.find(b => b.id === sale.bookid);
      if (book) {
        if (!bookSalesMap[book.id]) {
          bookSalesMap[book.id] = { id: book.id, name: book.name, count: 0 };
        }
        bookSalesMap[book.id].count += sale.quantity ?? 0;
      }
    });
    
    const sortedBooks = Object.values(bookSalesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    console.log("Top selling books:", sortedBooks);
    setTopSellingBooks(sortedBooks);
  }, [books, sales]);

  const handleCodeScanned = (code: string) => {
    const book = books.find(b => b.id === code);
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
    try {
      console.log("Submitting store creation:", data);
      // Set first store as default for admin
      const isFirstStore = stores.length === 0;
      const result = await addStore(data.name, data.location, isFirstStore);
      console.log("Store creation result:", result);
      
      if (result) {
        setIsAddStoreDialogOpen(false);
        form.reset();
        toast({
          title: t("common.success"),
          description: t("common.storeAdded"),
        });
      }
    } catch (error: any) {
      console.error("Failed to add store:", error);
      
      // Check if it's the max stores limit error
      if (error.message?.includes('maximum 10 stores')) {
        toast({
          title: t("common.error"),
          description: "You can create maximum 10 stores",
          variant: "destructive",
        });
      } else {
        toast({
          title: t("common.error"),
          description: t("common.failedToAddStore"),
          variant: "destructive",
        });
      }
    }
  };

  const analyticsLinks = {
    lowStock: () => navigate(`/books?lowStock=1`),
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales.filter(
    sale => {
      const saleDate = sale.createdat ? new Date(sale.createdat) : null;
      return saleDate && saleDate.getTime() >= today.getTime();
    }
  );

  const recentSales = [...sales]
    .sort((a, b) => {
      const dateA = new Date(a.createdat || 0).getTime();
      const dateB = new Date(b.createdat || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.bookStoreManager")}
        showBackButton={false}
        showSearchButton={true}
        showStallSelector={false}
        onSearch={() => navigate("/search")}
        leftIcon={<Menu size={24} />}
        onLeftIconClick={() => {
          navigate("/settings");
        }}
      />

      <div className="mobile-container flex flex-col md:flex-row md:items-center gap-2 mt-3">
        <div className="flex-1">
          {stores.length > 0 ? (
            <Select
              value={currentStore || ""}
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
                      {store.is_default ? " - Default" : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground py-2">
              {isLoading ? t("common.loading") : t("common.noStoresAvailable")}
            </div>
          )}
        </div>
        {isAdmin && stores.length < 10 && (
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
                          <span className="font-medium">{book.name}</span>: {t("common.inStock")}: <span className="font-semibold">{book.quantity}</span>
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
                <CardTitle className="text-lg text-temple-maroon">{t("common.quickActions")}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="bg-temple-saffron hover:bg-temple-saffron/90 h-auto py-3 flex flex-col items-center"
                    onClick={() => navigate("/books")}
                  >
                    <BookOpen size={24} className="mb-1" />
                    <span>{t("common.viewBooks")}</span>
                  </Button>

                  <Button
                    className="bg-temple-gold hover:bg-temple-gold/90 h-auto py-3 flex flex-col items-center"
                    onClick={() => navigate("/sales")}
                  >
                    <BarChart2 size={24} className="mb-1" />
                    <span>{t("common.salesHistory")}</span>
                  </Button>

                  {isAdmin && (
                    <Button
                      className="bg-temple-maroon hover:bg-temple-maroon/90 h-auto py-3 flex flex-col items-center"
                      onClick={() => navigate("/add-book")}
                    >
                      <PlusCircle size={24} className="mb-1" />
                      <span>{t("common.addBook")}</span>
                    </Button>
                  )}

                  <Button
                    className="bg-gray-100 hover:bg-gray-200 text-temple-maroon h-auto py-3 flex flex-col items-center"
                    variant="outline"
                    onClick={() => navigate("/search")}
                  >
                    <Search size={24} className="mb-1" />
                    <span>{t("common.search")}</span>
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
                            <p className="font-medium">{book?.name || t("common.unknownBook")}</p>
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
                    <p>{t("common.noSalesRecorded")}</p>
                    <p className="text-sm mt-1">{t("common.scanBookToMakeSale")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            {isLoading ? (
              <p>{t("common.loadingStores")}</p>
            ) : (
              <div className="space-y-4">
                <p className="text-temple-maroon font-medium">{t("common.noStoresAvailable")}</p>
                {isAdmin && (
                  <Button 
                    className="bg-temple-saffron hover:bg-temple-saffron/90"
                    onClick={() => setIsAddStoreDialogOpen(true)}
                  >
                    {t("common.addYourFirstStore")}
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
