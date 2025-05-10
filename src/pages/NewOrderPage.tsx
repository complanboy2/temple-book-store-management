
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
import { Loader2, Plus, Trash } from "lucide-react";
import BookImage from "@/components/BookImage";

type OrderItem = {
  bookId: string;
  bookName: string;
  quantity: number;
  priceAtOrder: number;
  imageUrl?: string;
};

const NewOrderPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [printingInstitute, setPrintingInstitute] = useState<string>("");
  const [institutes, setInstitutes] = useState<string[]>([]);
  
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
        console.log("NewOrderPage: Fetching books for store ID:", currentStore);
        
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

        if (data && Array.isArray(data)) {
          console.log(`NewOrderPage: Fetched ${data.length} books`);
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
          
          // Extract unique printing institutes
          const uniqueInstitutes = Array.from(
            new Set(formattedBooks.map(book => book.printingInstitute).filter(Boolean))
          );
          setInstitutes(uniqueInstitutes);
          
          if (formattedBooks.length > 0) {
            setSelectedBookId(formattedBooks[0].id);
          }
        } else {
          console.warn("Unexpected data format from Supabase:", data);
          setBooks([]);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBooks"),
          variant: "destructive",
        });
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

  const handleAddBook = () => {
    const selectedBook = books.find(book => book.id === selectedBookId);
    if (!selectedBook) {
      toast({
        title: t("common.error"),
        description: t("common.selectABook"),
        variant: "destructive",
      });
      return;
    }
    
    // Check if book already exists in order items
    const existingItemIndex = orderItems.findIndex(item => item.bookId === selectedBookId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      setOrderItems([...orderItems, {
        bookId: selectedBook.id,
        bookName: selectedBook.name,
        quantity: quantity,
        priceAtOrder: selectedBook.salePrice,
        imageUrl: selectedBook.imageUrl
      }]);
    }
    
    // Reset quantity
    setQuantity(1);
  };
  
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderItems.length || !currentStore) {
      toast({
        title: t("common.error"),
        description: t("common.selectABook"),
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const orderId = generateId();
      const orderDate = new Date();
      const totalAmount = calculateTotal();
      
      // Create the order entry
      const { error } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          status: 'pending',
          stallid: currentStore,
          adminid: currentUser?.id || "",
          totalamount: totalAmount,
          orderdate: orderDate.toISOString(),
          paymentstatus: "pending",
          createdat: orderDate.toISOString(),
          printinginstitute: printingInstitute,
          customername: "Store Order" // Required field but using fixed value
        });
      
      if (error) {
        console.error("Error creating order:", error);
        throw new Error(t("common.failedToCreateOrder"));
      }

      // Create the order items
      for (const item of orderItems) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            orderid: orderId,
            bookid: item.bookId,
            quantity: item.quantity,
            priceatorder: item.priceAtOrder,
            fulfilled: 0
          });

        if (itemError) {
          console.error("Error creating order item:", itemError);
          throw new Error(t("common.failedToCreateOrder"));
        }
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
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>{t("common.loading")}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateOrder} className="space-y-6">
                {/* Printing Institute Field */}
                <div className="grid gap-2">
                  <Label htmlFor="printingInstitute">{t("common.printingInstitute")}</Label>
                  <Select 
                    value={printingInstitute} 
                    onValueChange={setPrintingInstitute}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("common.selectInstitute")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- {t("common.selectInstitute")} --</SelectItem>
                      {institutes.map((inst) => (
                        <SelectItem key={inst} value={inst}>
                          {inst}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Book Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="book">{t("common.selectBook")}</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select 
                        value={selectedBookId} 
                        onValueChange={setSelectedBookId}
                        disabled={books.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("common.selectBook")} />
                        </SelectTrigger>
                        <SelectContent>
                          {books.length > 0 ? (
                            books.map((book) => (
                              <SelectItem key={book.id} value={book.id}>
                                {book.name} - ({t("common.availableQuantity")}: {book.quantity})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-books" disabled>
                              {t("common.noBooks")}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={handleQuantityChange}
                        min={1}
                      />
                    </div>
                    <Button 
                      type="button" 
                      onClick={handleAddBook}
                      disabled={!selectedBookId || books.length === 0}
                      className="bg-temple-saffron hover:bg-temple-saffron/90"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Order Items List */}
                {orderItems.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 font-medium text-sm">
                      {t("common.books")}
                    </div>
                    <div className="p-1">
                      {orderItems.map((item, index) => {
                        const book = books.find(b => b.id === item.bookId);
                        return (
                          <div 
                            key={index} 
                            className="flex items-center p-2 border-b last:border-b-0"
                          >
                            <div className="h-12 w-12 mr-3 flex-shrink-0">
                              <BookImage 
                                imageUrl={item.imageUrl} 
                                className="h-full w-full" 
                                alt={item.bookName}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.bookName}</p>
                              <p className="text-xs text-gray-600">
                                {t("common.quantity")}: {item.quantity} × ₹{item.priceAtOrder} = ₹{item.quantity * item.priceAtOrder}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-red-500 h-8 w-8"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                      <span className="font-medium">{t("common.total")}</span>
                      <span className="text-xl font-bold text-temple-maroon">₹{calculateTotal()}</span>
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || orderItems.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.processing")}
                      </>
                    ) : (
                      t("common.createOrder")
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewOrderPage;
