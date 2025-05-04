
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Book } from "@/types";
import { generateId } from "@/services/storageService";
import { useAuth } from "@/contexts/AuthContext";

const NewOrderPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBooks = async () => {
      if (!currentStore) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('stallid', currentStore)
          .order('name', { ascending: true });

        if (error) {
          console.error("Error fetching books:", error);
          toast({
            title: t("common.error"),
            description: t("common.failedToLoadBooks"),
            variant: "destructive",
          });
          return;
        }

        const formattedBooks = data.map((item): Book => ({
          id: item.id,
          barcode: item.barcode || "",
          name: item.name,
          author: item.author,
          category: item.category || "",
          printingInstitute: item.printinginstitute || "",
          originalPrice: item.originalprice,
          salePrice: item.saleprice,
          quantity: item.quantity,
          stallId: item.stallid,
          imageUrl: item.imageurl,
          createdAt: new Date(item.createdat),
          updatedAt: new Date(item.updatedat)
        }));

        setBooks(formattedBooks);
        if (formattedBooks.length > 0) {
          setSelectedBookId(formattedBooks[0].id);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [currentStore, toast, t]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else {
      setQuantity(value);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBookId || !currentStore) {
      toast({
        title: t("common.error"),
        description: t("common.selectABook"),
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const selectedBook = books.find(book => book.id === selectedBookId);
      if (!selectedBook) {
        throw new Error(t("common.bookNotFound"));
      }
      
      const orderId = generateId();
      const orderDate = new Date();
      
      // Fixed: use the correct structure for orders table
      const { error } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          customername: "Store Order", // Default name for store orders
          status: 'pending',
          stallid: currentStore,
          adminid: currentUser?.id || "",
          totalamount: selectedBook.salePrice * quantity,
          orderdate: orderDate.toISOString(),
          paymentstatus: "pending",
          createdat: orderDate.toISOString()
        });
      
      if (error) {
        console.error("Error creating order:", error);
        throw new Error(t("common.failedToCreateOrder"));
      }

      // Now create the order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          orderid: orderId,
          bookid: selectedBookId,
          quantity: quantity,
          priceatorder: selectedBook.salePrice,
          fulfilled: 0
        });

      if (itemError) {
        console.error("Error creating order item:", itemError);
        throw new Error(t("common.failedToCreateOrder"));
      }

      toast({
        title: t("common.success"),
        description: t("common.orderCreated"),
      });
      
      navigate('/orders');
    } catch (error) {
      console.error("Order creation error:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("common.unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.newOrder")} 
        showBackButton={true}
        backTo="/orders"
      />
      
      <main className="container mx-auto px-4 py-6">
        <Card className="temple-card">
          <CardHeader>
            <CardTitle className="text-lg text-temple-maroon">{t("common.createNewOrder")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrder} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="book">{t("common.selectBook")}</Label>
                <Select 
                  value={selectedBookId} 
                  onValueChange={setSelectedBookId}
                  disabled={isLoading || books.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("common.selectBook")} />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        {book.name} - {book.author} (₹{book.salePrice})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="quantity">{t("common.quantity")}</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  min={1}
                  className="max-w-xs"
                />
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !selectedBookId || isLoading}
                >
                  {isSubmitting ? t("common.processing") : t("common.createOrder")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewOrderPage;
