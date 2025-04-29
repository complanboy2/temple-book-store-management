
import React, { useEffect, useState } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useStallContext } from "@/contexts/StallContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { 
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface LowStockBook {
  id: string;
  name: string;
  quantity: number;
}

// Threshold for low stock alert (below this number triggers alert)
const LOW_STOCK_THRESHOLD = 5;

const LowStockNotification: React.FC = () => {
  const [lowStockBooks, setLowStockBooks] = useState<LowStockBook[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { currentStore } = useStallContext();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchLowStockBooks = async () => {
      if (!currentStore) return;
      
      try {
        const { data, error } = await supabase
          .from('books')
          .select('id, name, quantity')
          .eq('stallid', currentStore)
          .lt('quantity', LOW_STOCK_THRESHOLD)
          .order('quantity', { ascending: true });
          
        if (error) throw error;
        
        setLowStockBooks(data as LowStockBook[]);
        
        // Show toast for first low stock book if any exist
        if (data && data.length > 0 && !isOpen) {
          toast({
            title: t("common.lowStockAlert"),
            description: `"${data[0].name}" - ${t("common.onlyRemaining")} ${data[0].quantity} ${t("common.left")}`,
            variant: "destructive", // Changed from "warning" to "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching low stock books:", error);
      }
    };
    
    fetchLowStockBooks();
    
    // Set up polling for low stock alerts every 5 minutes
    const intervalId = setInterval(fetchLowStockBooks, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [currentStore, toast, t, isOpen]);
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {lowStockBooks.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
              {lowStockBooks.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("common.lowStockNotification")}</SheetTitle>
          <SheetDescription>
            {t("common.lowStockBooksDescription")}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {lowStockBooks.length > 0 ? (
            lowStockBooks.map(book => (
              <div 
                key={book.id} 
                className="p-4 border rounded-md cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  navigate(`/books/${book.id}`);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center">
                  <AlertTriangle className="text-amber-500 mr-2" size={18} />
                  <h3 className="font-medium">{book.name}</h3>
                </div>
                <div className="mt-1 text-sm text-red-600">
                  {t("common.onlyRemaining")}{" "}
                  <span className="font-bold">{book.quantity}</span>{" "}
                  {t("common.left")}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t("common.noLowStockItems")}
            </div>
          )}
          
          {lowStockBooks.length > 0 && (
            <SheetClose asChild>
              <Button 
                className="w-full mt-4"
                onClick={() => navigate("/books")}
              >
                {t("common.manageInventory")}
              </Button>
            </SheetClose>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LowStockNotification;
