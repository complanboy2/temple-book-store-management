
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import MobileHeader from "@/components/MobileHeader";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Minus, Trash2 } from "lucide-react";

interface SaleItem {
  book: Book;
  quantity: number;
}

const SellMultipleBooksPage = () => {
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [books, setBooks] = useState<Book[]>([]);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!currentStore) return;
      
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('stallid', currentStore)
          .gt('quantity', 0)
          .order('name');

        if (error) throw error;

        const formattedBooks: Book[] = (data || []).map((book, index) => ({
          id: book.id,
          bookCode: book.barcode || String(index + 1),
          name: book.name,
          author: book.author,
          category: book.category || "",
          language: book.language || "",
          printingInstitute: book.printinginstitute || "",
          originalPrice: book.originalprice || 0,
          salePrice: book.saleprice || 0,
          quantity: book.quantity || 0,
          stallId: book.stallid,
          imageUrl: book.imageurl,
          createdAt: book.createdat ? new Date(book.createdat) : new Date(),
          updatedAt: book.updatedat ? new Date(book.updatedat) : new Date()
        }));

        setBooks(formattedBooks);
      } catch (error) {
        console.error("Error fetching books:", error);
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
  }, [currentStore, t, toast]);

  const addBookToSale = (book: Book) => {
    const existingItem = saleItems.find(item => item.book.id === book.id);
    if (existingItem) {
      if (existingItem.quantity < book.quantity) {
        setSaleItems(prev => 
          prev.map(item => 
            item.book.id === book.id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        toast({
          title: t("common.error"),
          description: t("sell.insufficientStock"),
          variant: "destructive",
        });
      }
    } else {
      setSaleItems(prev => [...prev, { book, quantity: 1 }]);
    }
  };

  const updateQuantity = (bookId: string, newQuantity: number) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (newQuantity <= 0) {
      removeBookFromSale(bookId);
      return;
    }

    if (newQuantity > book.quantity) {
      toast({
        title: t("common.error"),
        description: t("sell.insufficientStock"),
        variant: "destructive",
      });
      return;
    }

    setSaleItems(prev => 
      prev.map(item => 
        item.book.id === bookId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeBookFromSale = (bookId: string) => {
    setSaleItems(prev => prev.filter(item => item.book.id !== bookId));
  };

  const handleMultipleSale = async () => {
    if (!currentUser || !currentStore || saleItems.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Process each sale item
      for (const item of saleItems) {
        const totalAmount = item.book.salePrice * item.quantity;
        
        // Record the sale
        const { error: saleError } = await supabase
          .from('sales')
          .insert({
            bookid: item.book.id,
            quantity: item.quantity,
            totalamount: totalAmount,
            paymentmethod: paymentMethod,
            buyername: buyerName || null,
            buyerphone: buyerPhone || null,
            personnelid: currentUser.email,
            stallid: currentStore,
            synced: false
          });

        if (saleError) throw saleError;

        // Update book quantity
        const { error: updateError } = await supabase
          .from('books')
          .update({ 
            quantity: item.book.quantity - item.quantity,
            updatedat: new Date().toISOString()
          })
          .eq('id', item.book.id);

        if (updateError) throw updateError;
      }

      const totalAmount = saleItems.reduce((sum, item) => sum + (item.book.salePrice * item.quantity), 0);
      
      toast({
        title: t("common.success"),
        description: `${t("sell.multiSaleRecorded")} - Total: ₹${totalAmount.toFixed(2)}`,
      });

      // Redirect to books page after successful sale
      console.log("DEBUG: Multiple sale complete, redirecting to /books");
      navigate("/books");
      
    } catch (error) {
      console.error("Error recording multiple sale:", error);
      toast({
        title: t("common.error"),
        description: t("sell.saleRecordingFailed"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalAmount = saleItems.reduce((sum, item) => sum + (item.book.salePrice * item.quantity), 0);
  const totalItems = saleItems.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-temple-background">
        <MobileHeader 
          title={t("sell.sellMultipleBooks")}
          showBackButton={true}
          backTo="/books"
        />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("sell.sellMultipleBooks")}
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Available Books */}
        <Card>
          <CardHeader>
            <CardTitle>{t("sell.availableBooks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
              {books.map(book => (
                <div key={book.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{book.name}</h4>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <p className="text-sm">₹{book.salePrice} | {t("common.available")}: {book.quantity}</p>
                  </div>
                  <Button
                    onClick={() => addBookToSale(book)}
                    size="sm"
                    disabled={book.quantity === 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sale Items */}
        {saleItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("sell.selectedBooks")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {saleItems.map(item => (
                <div key={item.book.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.book.name}</h4>
                    <p className="text-sm text-muted-foreground">₹{item.book.salePrice} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.book.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.book.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeBookFromSale(item.book.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t("sell.total")} ({totalItems} items)</span>
                  <span className="text-lg font-bold text-green-600">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sale Details */}
        {saleItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("sell.saleDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("sell.paymentMethod")}</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash">{t("sell.cash")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi">{t("sell.upi")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">{t("sell.card")}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="buyerName">{t("sell.buyerName")} ({t("common.optional")})</Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="buyerPhone">{t("sell.buyerPhone")} ({t("common.optional")})</Label>
                <Input
                  id="buyerPhone"
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes">{t("common.notes")} ({t("common.optional")})</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleMultipleSale}
                disabled={isProcessing || saleItems.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("sell.processing")}
                  </>
                ) : (
                  t("sell.completeSale")
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SellMultipleBooksPage;
