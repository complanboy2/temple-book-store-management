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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Book {
  id: string;
  name: string;
  quantity: number;
}

interface Activity {
  id: string;
  name: string;
  description?: string;
  created_at: string;
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentStore) return;

      try {
        // Fetch low stock books
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

        // Fetch activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false });

        if (activitiesError) {
          console.error("Error fetching activities:", activitiesError);
        } else {
          setActivities(activitiesData || []);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchData();
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
      title: t("common.viewBooks"),
      description: t("common.browseInventory"),
      icon: BookOpen,
      route: "/books",
      color: "bg-blue-400"
    },
    {
      title: t("common.sellBooks"),
      description: t("common.quickSaleTransaction"),
      icon: ShoppingCart,
      route: "/sell",
      color: "bg-green-400"
    },
    {
      title: t("common.addBook"),
      description: t("common.addNewBooksInventory"),
      icon: Package,
      route: "/books/add",
      color: "bg-purple-400",
      adminOnly: true
    },
    {
      title: t("common.viewSalesHistory"),
      description: t("common.viewTransactionRecords"),
      icon: BarChart3,
      route: "/sales/history",
      color: "bg-orange-400"
    },
    {
      title: t("common.reports"),
      description: t("common.analyticsInsights"),
      icon: BarChart3,
      route: "/reports",
      color: "bg-indigo-400",
      adminOnly: true
    },
    {
      title: t("common.adminPanel"),
      description: t("common.userSystemManagement"),
      icon: Users,
      route: "/admin",
      color: "bg-gray-400",
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

        {/* Books and Activities Sections */}
        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="menu" className="space-y-4">
            {/* Simplified, accessible Menu Tiles with readable text & subtler background */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMenuTiles.map((tile, index) => {
                const IconComponent = tile.icon;
                return (
                  <Card 
                    key={index}
                    className="cursor-pointer transition-all duration-200 hover:scale-102 hover:shadow-md border"
                    onClick={() => navigate(tile.route)}
                  >
                    <div className="bg-neutral-100 p-4 rounded-lg flex items-center gap-3">
                      <div className="bg-temple-maroon/10 p-2 rounded-md text-temple-maroon flex-shrink-0">
                        <IconComponent size={24} />
                      </div>
                      <div className="flex-1 ml-2">
                         <h3 className="font-semibold text-base leading-tight text-temple-maroon">
                           {tile.title}
                         </h3>
                         <p className="text-xs text-gray-700 mt-1">{tile.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="books" className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                View all books in your inventory
              </p>
              <Button onClick={() => navigate('/books')} variant="outline">
                Go to Books
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="activities" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{activity.name}</CardTitle>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {activity.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {activities.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No activities created yet. Go to Activity Management to create activities.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default Index;
