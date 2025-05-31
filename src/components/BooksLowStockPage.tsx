
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Package, Plus } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";

interface Book {
  id: string;
  name: string;
  quantity: number;
  author: string;
  category?: string;
  saleprice: number;
}

const BooksLowStockPage = () => {
  const [lowStockBooks, setLowStockBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentStore } = useStallContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLowStockFilter = searchParams.get('lowStock') === 'true';

  useEffect(() => {
    const fetchLowStockBooks = async () => {
      if (!currentStore) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('books')
          .select('id, name, quantity, author, category, saleprice')
          .eq('stallid', currentStore)
          .lte('quantity', 5)
          .order('quantity', { ascending: true });

        if (error) {
          console.error("Error fetching low stock books:", error);
        } else {
          setLowStockBooks(data || []);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockBooks();
  }, [currentStore]);

  const handleAddAllToOrder = () => {
    // Create order with all low stock books
    const orderData = {
      books: lowStockBooks.map(book => ({
        id: book.id,
        name: book.name,
        quantity: Math.max(10 - book.quantity, 1), // Order enough to reach 10, minimum 1
        price: book.saleprice
      }))
    };
    
    // Navigate to new order page with pre-filled data
    navigate('/orders/new', { state: { prefilledBooks: orderData.books } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-temple-background">
        <MobileHeader 
          title={t("common.lowStockAlert")}
          showBackButton={true}
          showStallSelector={true}
        />
        <div className="mobile-container py-4">
          <div className="text-center">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader 
        title={t("common.lowStockAlert")}
        showBackButton={true}
        showStallSelector={true}
      />
      
      <div className="mobile-container py-4">
        {isLowStockFilter && lowStockBooks.length > 0 && (
          <Card className="mb-4 bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-orange-800">
                    {lowStockBooks.length} {t("common.booksRunningLow")}
                  </h3>
                  <p className="text-sm text-orange-600">
                    {t("common.createNewOrder")}
                  </p>
                </div>
                <Button
                  onClick={handleAddAllToOrder}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("common.addAllToOrder")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {lowStockBooks.map((book) => (
            <Card key={book.id} className="temple-card">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-temple-maroon truncate">
                      {book.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {t("common.by")} {book.author}
                    </p>
                    {book.category && (
                      <p className="text-xs text-gray-500">{book.category}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-medium text-temple-maroon">
                        ₹{book.saleprice}
                      </span>
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        {t("common.inStock")}: {book.quantity}
                      </span>
                    </div>
                  </div>
                  <Package className="h-5 w-5 text-orange-500 ml-2 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
          
          {lowStockBooks.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t("common.noBooks")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BooksLowStockPage;
