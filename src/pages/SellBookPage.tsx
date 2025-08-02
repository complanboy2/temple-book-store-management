
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Package, CreditCard } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import BookImage from "@/components/BookImage";

interface Book {
  id: string;
  name: string;
  author: string;
  category: string;
  saleprice: number;
  quantity: number;
  imageurl?: string;
}

const SellBookPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [quantity, setQuantity] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isLoading, setIsLoading] = useState(true);
  const [isSelling, setIsSelling] = useState(false);

  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (bookId && currentStore) {
      fetchBook();
    }
  }, [bookId, currentStore]);

  const fetchBook = async () => {
    if (!bookId || !currentStore) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('stallid', currentStore)
        .single();

      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error("Error fetching book:", error);
      toast({
        title: t("common.error"),
        description: t("books.bookNotFound"),
        variant: "destructive",
      });
      navigate("/books");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow positive integers
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
      setQuantity(value);
    }
  };

  const handleSell = async () => {
    if (!book || !currentUser || !currentStore) return;

    const sellQuantity = parseInt(quantity);
    
    if (!sellQuantity || sellQuantity <= 0) {
      toast({
        title: t("common.error"),
        description: t("sell.invalidQuantity"),
        variant: "destructive",
      });
      return;
    }

    if (sellQuantity > book.quantity) {
      toast({
        title: t("common.error"),
        description: t("sell.insufficientStock"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSelling(true);

      // Calculate total amount
      const totalAmount = sellQuantity * book.saleprice;

      // Create sale record
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          bookid: book.id,
          quantity: sellQuantity,
          totalamount: totalAmount,
          paymentmethod: paymentMethod,
          buyername: buyerName || null,
          buyerphone: buyerPhone || null,
          personnelid: currentUser.id,
          stallid: currentStore,
        });

      if (saleError) throw saleError;

      // Update book quantity
      const { error: updateError } = await supabase
        .from('books')
        .update({
          quantity: book.quantity - sellQuantity,
          updatedat: new Date().toISOString()
        })
        .eq('id', book.id);

      if (updateError) throw updateError;

      toast({
        title: t("common.success"),
        description: t("sell.saleRecorded", { 
          quantity: sellQuantity, 
          book: book.name,
          amount: totalAmount 
        }),
      });

      navigate("/books");
    } catch (error) {
      console.error("Error recording sale:", error);
      toast({
        title: t("common.error"),
        description: t("sell.saleRecordingFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-temple-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-maroon mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-temple-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-bold text-red-600 mb-2">{t("books.bookNotFound")}</h2>
            <Button onClick={() => navigate("/books")}>{t("common.goBack")}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = quantity ? parseInt(quantity) * book.saleprice : 0;

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("sell.sellBook")}
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-3 py-4">
        {/* Book Information */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="w-20 h-28 flex-shrink-0">
                <BookImage 
                  imageUrl={book.imageurl} 
                  alt={book.name}
                  size="medium"
                  className="w-full h-full object-cover rounded"
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-lg font-bold text-temple-maroon mb-1">
                  {book.name}
                </h2>
                <p className="text-sm text-gray-600 mb-1">
                  {t("common.by")} {book.author}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  {book.category}
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-xl font-bold text-temple-maroon">
                    ₹{book.saleprice}
                  </div>
                  <div className={`text-sm font-medium ${
                    book.quantity <= 5 ? 'text-red-600' : 
                    book.quantity <= 10 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    <Package className="inline h-4 w-4 mr-1" />
                    {book.quantity} {t("common.available")}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sale Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              {t("sell.saleDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quantity Input */}
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium">
                {t("common.quantity")} *
              </Label>
              <Input
                id="quantity"
                type="text"
                value={quantity}
                onChange={handleQuantityChange}
                placeholder={t("placeholders.quantity")}
                className="mt-1"
                max={book.quantity}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("sell.maxQuantity", { max: book.quantity })}
              </p>
            </div>

            {/* Buyer Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">
                {t("sell.buyerInformation")} ({t("common.optional")})
              </h3>
              
              <div>
                <Label htmlFor="buyerName" className="text-sm">
                  {t("common.name")}
                </Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder={t("sell.buyerNamePlaceholder")}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="buyerPhone" className="text-sm">
                  {t("common.phone")}
                </Label>
                <Input
                  id="buyerPhone"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder={t("sell.buyerPhonePlaceholder")}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-sm font-medium">
                {t("sell.paymentMethod")} *
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t("sell.cash")}
                    </div>
                  </SelectItem>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t("sell.upi")}
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {t("sell.card")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Total Amount */}
            {totalAmount > 0 && (
              <div className="bg-temple-background p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {t("sell.totalAmount")}:
                  </span>
                  <span className="text-xl font-bold text-temple-maroon">
                    ₹{totalAmount}
                  </span>
                </div>
              </div>
            )}

            {/* Sell Button */}
            <Button 
              onClick={handleSell}
              disabled={!quantity || parseInt(quantity) <= 0 || isSelling}
              className="w-full bg-temple-maroon hover:bg-temple-maroon/90 text-white"
            >
              {isSelling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t("sell.processing")}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t("sell.completeSale")}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SellBookPage;
