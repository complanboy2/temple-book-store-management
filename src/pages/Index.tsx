
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import MobileHeader from "@/components/MobileHeader";
import MainMenu from "@/components/MainMenu";
import LowStockNotification from "@/components/LowStockNotification";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStallContext } from "@/contexts/StallContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Book {
  id: string;
  name: string;
  quantity: number;
}

const Index: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { currentStore } = useStallContext();
  const [lowStockBooks, setLowStockBooks] = useState<Book[]>([]);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader 
        title="Temple Book Stall" 
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
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-2">
            Welcome, {currentUser?.name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Manage your temple book stall efficiently
          </p>
        </div>

        {/* Low Stock Alert */}
        {lowStockBooks.length > 0 && (
          <div className="mb-6" onClick={handleLowStockClick}>
            <LowStockNotification books={lowStockBooks} />
          </div>
        )}

        <MainMenu />
      </div>
    </div>
  );
};

export default Index;
