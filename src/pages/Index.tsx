import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, BarChart2, BookIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import LowStockNotification from "@/components/LowStockNotification";

const Index = () => {
  const navigate = useNavigate();
  const { currentStore, stores } = useStallContext();
  const { currentUser, isAdmin, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [totalBooks, setTotalBooks] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  
  // Threshold for low stock
  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentStore) return;
      
      setIsLoading(true);
      
      try {
        // Get total books count
        const { count: booksCount } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('stallid', currentStore);
        
        // Get today's sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: todaySalesData } = await supabase
          .from('sales')
          .select('quantity, totalamount')
          .eq('stallid', currentStore)
          .gte('createdat', today.toISOString());
        
        const salesCount = todaySalesData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        const revenue = todaySalesData?.reduce((sum, item) => sum + item.totalamount, 0) || 0;
        
        // Get low stock count
        const { count: lowStock } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('stallid', currentStore)
          .lt('quantity', LOW_STOCK_THRESHOLD);
        
        setTotalBooks(booksCount || 0);
        setTodaySales(salesCount);
        setTotalRevenue(revenue);
        setLowStockCount(lowStock || 0);
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
    
    // Refresh stats every 5 minutes
    const intervalId = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [currentStore]);
  
  // Navigation handlers for clickable stat cards
  const goToBooks = () => navigate("/books");
  
  const goToTodaySales = () => {
    // Create today's date string in ISO format for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    navigate(`/sales?fromDate=${todayStr}`);
  };
  
  const goToRevenue = () => navigate("/sales");
  
  const goToLowStock = () => navigate("/books?lowStock=true");
  
  if (!isAuthenticated) {
    return null; // Will redirect to login in useEffect
  }

  return (
    <div className="bg-temple-background min-h-screen pb-20">
      <MobileHeader 
        title={t("common.templeBookStall")}
        showBackButton={false}
        showSearchButton={true}
        onSearch={() => navigate("/search")}
        showStallSelector={stores.length > 1}
      />
      
      <div className="bg-temple-maroon/80 py-2 px-4 text-center">
        <h2 className="text-sm font-medium text-white">{t("common.bookStoreManager")}</h2>
      </div>
      
      {currentStore ? (
        <div className="mobile-container px-4 py-6">
          {/* Stats Cards - Now Clickable */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card 
              onClick={goToBooks}
              className="bg-white border-temple-gold/20 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <CardContent className="p-4">
                <h3 className="text-sm text-gray-600 mb-1">{t("dashboard.totalBooks")}</h3>
                <p className="text-2xl font-bold text-temple-maroon">{isLoading ? "..." : totalBooks}</p>
              </CardContent>
            </Card>
            
            <Card 
              onClick={goToTodaySales}
              className="bg-white border-temple-gold/20 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <CardContent className="p-4">
                <h3 className="text-sm text-gray-600 mb-1">{t("dashboard.salesToday")}</h3>
                <p className="text-2xl font-bold text-temple-saffron">{isLoading ? "..." : todaySales}</p>
              </CardContent>
            </Card>
            
            <Card 
              onClick={goToRevenue}
              className="bg-white border-temple-gold/20 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <CardContent className="p-4">
                <h3 className="text-sm text-gray-600 mb-1">{t("dashboard.revenue")}</h3>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? "..." : `₹${totalRevenue.toFixed(2)}`}
                </p>
              </CardContent>
            </Card>
            
            <Card 
              onClick={goToLowStock}
              className={`bg-white border-temple-gold/20 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors ${lowStockCount > 0 ? 'border-red-300' : ''}`}
            >
              <CardContent className="p-4">
                <h3 className="text-sm text-gray-600 mb-1">{t("dashboard.lowStock")}</h3>
                <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-500' : 'text-temple-maroon'}`}>
                  {isLoading ? "..." : lowStockCount}
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Action Cards */}
          <div className="space-y-4">
            {/* Book Management */}
            <div className="mobile-card">
              <h2 className="mobile-header">{t("common.bookManagement")}</h2>
              
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div className="flex flex-col bg-temple-background/50 rounded-lg p-4 border border-temple-gold/20">
                  <h3 className="font-medium mb-1">{t("common.manageAndSellBooks")}</h3>
                  <p className="text-sm text-gray-600 mb-3">{t("common.manageYourBookInventory")}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <Button 
                      variant="outline"
                      className="flex-1 justify-center border-temple-gold/30 text-temple-maroon flex items-center"
                      onClick={() => navigate("/books")}
                    >
                      <BookIcon size={16} className="mr-1" /> {t("common.books")}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex-1 justify-center border-temple-gold/30 text-temple-maroon flex items-center"
                      onClick={() => navigate("/sell/new")}
                    >
                      <Plus size={16} className="mr-1" /> {t("common.sell")}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="flex-1 justify-center border-temple-gold/30 text-temple-maroon flex items-center"
                      onClick={() => navigate("/search")}
                    >
                      <Search size={16} className="mr-1" /> {t("common.search")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Admin Section */}
            {isAdmin && (
              <div className="mobile-card">
                <h2 className="mobile-header">{t("common.administration")}</h2>
                
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div className="flex flex-col bg-temple-background/50 rounded-lg p-4 border border-temple-gold/20">
                    <h3 className="font-medium mb-1">{t("common.analytics")}</h3>
                    <p className="text-sm text-gray-600 mb-3">{t("common.trackYourStallPerformance")}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Button 
                        variant="outline"
                        className="flex-1 justify-center border-temple-gold/30 text-temple-maroon flex items-center"
                        onClick={() => navigate("/reports")}
                      >
                        <BarChart2 size={16} className="mr-1" /> {t("common.reports")}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        className="flex-1 justify-center border-temple-gold/30 text-temple-maroon flex items-center"
                        onClick={() => navigate("/settings")}
                      >
                        <BookIcon size={16} className="mr-1" /> {t("common.more")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Privacy Policy Link */}
            <div className="text-center mt-8 pb-4">
              <Button 
                variant="link" 
                className="text-temple-maroon/70 text-sm"
                onClick={() => navigate("/privacy-policy")}
              >
                {t("common.privacyPolicy")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mobile-container flex flex-col items-center justify-center py-16">
          <h2 className="text-xl font-bold text-temple-maroon">{t("common.welcomeToBookStore")}</h2>
          <p className="text-gray-600 mb-6 text-center">{t("common.pleaseSelectStore")}</p>
          <Button 
            onClick={() => navigate("/settings")} 
            className="bg-temple-saffron hover:bg-temple-saffron/90"
          >
            <Plus size={16} className="mr-1" /> {t("common.addStore")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
