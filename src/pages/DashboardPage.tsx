
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, TrendingUp, Package, LogOut } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import LowStockNotification from "@/components/LowStockNotification";
import BookImage from "@/components/BookImage";
import { useAuth } from "@/contexts/AuthContext";

interface Book {
  id: string;
  name: string;
  quantity: number;
}

interface Sale {
  id: string;
  bookid: string;
  quantity: number;
  totalamount: number;
  createdat: string;
  buyername?: string;
  book_name?: string;
  book_imageurl?: string;
}

const DashboardPage = () => {
  const [lowStockBooks, setLowStockBooks] = useState<Book[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const { currentStore } = useStallContext();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentStore) return;

      try {
        // Fetch low stock books (quantity <= 5)
        const { data: lowStockData, error: lowStockError } = await supabase
          .from('books')
          .select('id, name, quantity')
          .eq('stallid', currentStore)
          .lte('quantity', 5)
          .order('quantity', { ascending: true });

        if (lowStockError) {
          console.error("Error fetching low stock books:", lowStockError);
        } else {
          setLowStockBooks(lowStockData || []);
        }

        // Fetch recent sales (last 10) with book details
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select(`
            *,
            books (
              name,
              imageurl
            )
          `)
          .eq('stallid', currentStore)
          .order('createdat', { ascending: false })
          .limit(10);

        if (salesError) {
          console.error("Error fetching recent sales:", salesError);
        } else {
          const salesWithBookInfo = salesData?.map(sale => ({
            ...sale,
            book_name: sale.books?.name || 'Unknown Book',
            book_imageurl: sale.books?.imageurl || ''
          })) || [];
          setRecentSales(salesWithBookInfo);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchDashboardData();
  }, [currentStore]);

  const handleLowStockClick = () => {
    navigate("/books?lowStock=true");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader 
        title={t("common.home")}
        showBackButton={false}
        showStallSelector={true}
        rightContent={
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white"
            onClick={handleLogout}
          >
            <LogOut size={20} />
          </Button>
        }
      />
      
      <div className="mobile-container py-4 space-y-4">
        {/* Welcome Section */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-temple-maroon mb-2">
            {t("common.welcomeToBookStore")}
          </h1>
          <p className="text-sm text-gray-600">
            {t("common.manageBooksEfficiently")}
          </p>
        </div>

        {/* Low Stock Alert */}
        {lowStockBooks.length > 0 && (
          <div onClick={handleLowStockClick} className="cursor-pointer">
            <LowStockNotification books={lowStockBooks} />
          </div>
        )}

        {/* Quick Actions */}
        <Card className="temple-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-temple-maroon flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-temple-gold" />
              {t("common.quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate("/books")}
                className="bg-temple-saffron hover:bg-temple-saffron/90 text-white h-12 text-sm"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {t("common.viewBooks")}
              </Button>
              <Button
                onClick={() => navigate("/sell")}
                className="bg-temple-maroon hover:bg-temple-maroon/90 text-white h-12 text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("common.sell")}
              </Button>
            </div>
            <Button
              onClick={() => navigate("/books/add")}
              variant="outline"
              className="w-full h-12 border-temple-gold text-temple-maroon hover:bg-temple-gold/10"
            >
              <Package className="h-4 w-4 mr-2" />
              {t("common.addNewBook")}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Sales with Thumbnails */}
        <Card className="temple-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-temple-maroon">
              {t("dashboard.recentSales")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0">
                    {/* Book Thumbnail */}
                    <div className="flex-shrink-0">
                      <BookImage 
                        imageUrl={sale.book_imageurl} 
                        alt={sale.book_name}
                        size="small"
                        className="w-12 h-16 rounded border border-gray-200"
                      />
                    </div>
                    
                    {/* Sale Details */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {sale.book_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sale.buyername || "Walk-in Customer"} • {sale.quantity} {t("common.sold")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(sale.createdat).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-temple-maroon">
                        ₹{sale.totalamount}
                      </p>
                    </div>
                  </div>
                ))}
                {recentSales.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/sales")}
                    className="w-full text-temple-maroon"
                  >
                    {t("common.viewAll")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">{t("common.noSalesRecorded")}</p>
                <p className="text-xs text-gray-400 mt-1">{t("common.scanBookToMakeSale")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
