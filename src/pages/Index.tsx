
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import MobileHeader from "@/components/MobileHeader";
import LowStockNotification from "@/components/LowStockNotification";
import StallSelector from "@/components/StallSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Store, BookOpen, ShoppingCart, Package, BarChart3, Settings, Users } from "lucide-react";
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

interface MenuTile {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  color: string;
  adminOnly?: boolean;
}

const Index: React.FC = () => {
  const { currentUser, logout, isAdmin } = useAuth();
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

  const menuTiles: MenuTile[] = [
    {
      title: "View Books",
      description: "Browse and manage book inventory",
      icon: BookOpen,
      route: "/books",
      color: "bg-blue-500"
    },
    {
      title: "Sell Books",
      description: "Quick sale and transaction",
      icon: ShoppingCart,
      route: "/sell",
      color: "bg-green-500"
    },
    {
      title: "Add Books",
      description: "Add new books to inventory",
      icon: Package,
      route: "/books/add",
      color: "bg-purple-500",
      adminOnly: true
    },
    {
      title: "Sales History",
      description: "View transaction records",
      icon: BarChart3,
      route: "/sales/history",
      color: "bg-orange-500"
    },
    {
      title: "Reports",
      description: "Analytics and insights",
      icon: BarChart3,
      route: "/reports",
      color: "bg-indigo-500",
      adminOnly: true
    },
    {
      title: "Admin Panel",
      description: "User and system management",
      icon: Users,
      route: "/admin",
      color: "bg-red-500",
      adminOnly: true
    }
  ];

  const filteredMenuTiles = menuTiles.filter(tile => !tile.adminOnly || isAdmin);

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
          <div className="mb-6" onClick={handleLowStockClick}>
            <LowStockNotification books={lowStockBooks} />
          </div>
        )}

        {/* Simplified Menu Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {filteredMenuTiles.map((tile, index) => {
            const IconComponent = tile.icon;
            return (
              <Card 
                key={index}
                className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md border-0"
                onClick={() => navigate(tile.route)}
              >
                <div className={`${tile.color} p-4 text-white`}>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base leading-tight">
                        {tile.title}
                      </h3>
                      <p className="text-xs opacity-90 leading-tight mt-1">
                        {tile.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <Card className="bg-temple-maroon text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Current Store</h3>
                <p className="text-sm opacity-90">{getCurrentStoreName()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Low Stock Items</p>
                <p className="text-2xl font-bold">{lowStockBooks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
