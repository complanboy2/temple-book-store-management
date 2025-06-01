
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import MobileHeader from "@/components/MobileHeader";
import MainMenu from "@/components/MainMenu";
import LowStockNotification from "@/components/LowStockNotification";
import StallSelector from "@/components/StallSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStallContext } from "@/contexts/StallContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface Book {
  id: string;
  name: string;
  quantity: number;
}

const Index: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { currentStore, stores } = useStallContext();
  const [lowStockBooks, setLowStockBooks] = useState<Book[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchLowStockBooks = async () => {
      if (!currentStore) return;

      try {
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
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchLowStockBooks();
  }, [currentStore]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLowStockClick = () => {
    navigate("/books?filter=lowStock");
  };

  const getCurrentStoreName = () => {
    return stores?.find(store => store.id === currentStore)?.name || t("common.selectStore");
  };

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader 
        title={t("appName")}
        rightContent={
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white"
            onClick={handleLogout}
          >
            <LogOut size={18} />
          </Button>
        }
      />
      
      <div className="container mx-auto px-3 py-4">
        {/* Store Selector Card */}
        <Card className="mb-4 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-temple-maroon flex items-center gap-2">
              <Store className="h-5 w-5" />
              {t("common.currentStore")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <StallSelector />
            <p className="text-sm text-gray-600 mt-2">
              {t("common.allDataBelongsToStore")}
            </p>
          </CardContent>
        </Card>

        <div className="mb-4">
          <h1 className="text-xl font-bold text-temple-maroon mb-1">
            {t("common.welcome")}, {currentUser?.name || t("common.user")}!
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("common.manageBookStoreEfficiently")}
          </p>
        </div>

        {/* Low Stock Alert */}
        {lowStockBooks.length > 0 && (
          <div className="mb-4" onClick={handleLowStockClick}>
            <LowStockNotification books={lowStockBooks} />
          </div>
        )}

        <MainMenu />
      </div>
    </div>
  );
};

export default Index;
