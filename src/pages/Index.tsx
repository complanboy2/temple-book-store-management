
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStallContext } from "@/contexts/StallContext";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";
import StatsCard from "@/components/StatsCard";
import LowStockNotification from "@/components/LowStockNotification";
import MainMenu from "@/components/MainMenu";
import { supabase } from "@/integrations/supabase/client";
import { Book, Sale } from "@/types";

const Index = () => {
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [topSellingBooks, setTopSellingBooks] = useState<{ bookName: string; totalSold: number }[]>([]);
  const [lowStockBooks, setLowStockBooks] = useState<Book[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const { currentUser, logout } = useAuth();
  const { currentStore, isLoading: stallLoading } = useStallContext();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentStore || stallLoading) {
        console.log("No current store or still loading stalls, skipping stats fetch");
        return;
      }

      try {
        setStatsLoading(true);
        console.log("Fetching stats for store:", currentStore);

        // Fetch total books
        const { count: booksCount } = await supabase
          .from("books")
          .select("*", { count: "exact" })
          .eq("stallid", currentStore);
        
        console.log("Books count:", booksCount);
        setTotalBooks(booksCount || 0);

        // Fetch total sales
        const { count: salesCount } = await supabase
          .from("sales")
          .select("*", { count: "exact" })
          .eq("stallid", currentStore);
        
        console.log("Sales count:", salesCount);
        setTotalSales(salesCount || 0);

        // Fetch total revenue
        const { data: salesData } = await supabase
          .from("sales")
          .select("totalamount")
          .eq("stallid", currentStore);

        const revenue = salesData?.reduce((acc, sale) => acc + sale.totalamount, 0) || 0;
        console.log("Total revenue:", revenue);
        setTotalRevenue(revenue);

        // Fetch top selling books
        const { data: topBooksData } = await supabase.from("sales").select(`
            bookid,
            books (
              name
            )
          `).eq("stallid", currentStore);

        if (topBooksData) {
          const bookCounts: { [bookId: string]: number } = {};
          topBooksData.forEach((sale) => {
            const bookId = sale.bookid;
            bookCounts[bookId] = (bookCounts[bookId] || 0) + 1;
          });

          const sortedBooks = Object.entries(bookCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5);

          const topBooks = sortedBooks.map(([bookId]) => {
            const book = topBooksData.find((sale) => sale.bookid === bookId);
            return {
              bookName: book?.books?.name || "Unknown",
              totalSold: bookCounts[bookId],
            };
          });
          setTopSellingBooks(topBooks);
        }

        // Fetch low stock books and transform to Book type
        const { data: lowStockData } = await supabase
          .from("books")
          .select("*")
          .eq("stallid", currentStore)
          .lt("quantity", 5);
        
        if (lowStockData) {
          const transformedBooks: Book[] = lowStockData.map(book => ({
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
            imageUrl: book.imageurl,
            createdAt: book.createdat ? new Date(book.createdat) : new Date(),
            updatedAt: book.updatedat ? new Date(book.updatedat) : new Date()
          }));
          setLowStockBooks(transformedBooks);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [currentStore, stallLoading]);

  const handleLogout = () => {
    logout();
  };

  // Show loading while stalls are loading
  if (stallLoading) {
    return (
      <div className="min-h-screen bg-temple-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-maroon mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader
        title={t("common.dashboard")}
        showStallSelector={true}
        rightContent={
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            {t("common.logout")}
          </Button>
        }
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-temple-maroon mb-2">
              {t("common.welcome")}, {currentUser?.name}
            </h1>
            <p className="text-muted-foreground">{t("common.manageBooksEfficiently")}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title={t("common.totalBooks")}
              value={statsLoading ? "..." : totalBooks.toString()}
              icon="📚"
            />
            <StatsCard
              title={t("common.totalSales")}
              value={statsLoading ? "..." : totalSales.toString()}
              icon="💰"
            />
            <StatsCard
              title={t("common.revenue")}
              value={statsLoading ? "..." : `₹${totalRevenue.toFixed(2)}`}
              icon="📈"
            />
          </div>

          {/* Low Stock Notification */}
          {lowStockBooks.length > 0 && (
            <LowStockNotification books={lowStockBooks} />
          )}

          {/* Main Menu */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">{t("common.quickActions")}</h2>
            <MainMenu />
          </Card>

          {/* Top Selling Books */}
          {topSellingBooks.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">{t("common.topSellingBooks")}</h2>
              <div className="space-y-2">
                {topSellingBooks.slice(0, 5).map((book, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="font-medium">{book.bookName}</span>
                    <span className="text-muted-foreground">{book.totalSold} {t("common.sold")}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
