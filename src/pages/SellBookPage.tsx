
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import MobileHeader from "@/components/MobileHeader";
import BookImage from "@/components/BookImage";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const SellBookPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [book, setBook] = useState<Book | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId || !currentStore) return;
      
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', bookId)
          .eq('stallid', currentStore)
          .single();

        if (error) throw error;

        const formattedBook: Book = {
          id: data.id,
          bookCode: data.barcode || `BOOK-${data.id.slice(-6).toUpperCase()}`,
          name: data.name,
          author: data.author,
          category: data.category || "",
          language: data.language || "",
          printingInstitute: data.printinginstitute || "",
          originalPrice: data.originalprice || 0,
          salePrice: data.saleprice || 0,
          quantity: data.quantity || 0,
          stallId: data.stallid,
          imageUrl: data.imageurl,
          createdAt: data.createdat ? new Date(data.createdat) : new Date(),
          updatedAt: data.updatedat ? new Date(data.updatedat) : new Date()
        };

        setBook(formattedBook);
      } catch (error) {
        console.error("Error fetching book:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBook"),
          variant: "destructive",
        });
        navigate("/books");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [bookId, currentStore, navigate, t, toast]);

  const handleSale = async () => {
    if (!book || !currentUser || !currentStore) return;
    
    if (quantity > book.quantity) {
      toast({
        title: t("common.error"),
        description: t("sell.insufficientStock"),
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const totalAmount = book.salePrice * quantity;
      
      console.log("DEBUG: Recording sale with seller:", currentUser.email);
      
      // Record the sale with proper seller information
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          bookid: book.id,
          quantity: quantity,
          totalamount: totalAmount,
          paymentmethod: paymentMethod,
          buyername: buyerName || null,
          buyerphone: buyerPhone || null,
          personnelid: currentUser.email, // Use email as personnelid
          stallid: currentStore,
          synced: false
        });

      if (saleError) throw saleError;

      // Update book quantity
      const { error: updateError } = await supabase
        .from('books')
        .update({ 
          quantity: book.quantity - quantity,
          updatedat: new Date().toISOString()
        })
        .eq('id', book.id);

      if (updateError) throw updateError;

      toast({
        title: t("common.success"),
        description: t("sell.saleRecorded"),
      });

      // FIXED: Redirect to sales history after successful sale
      console.log("DEBUG: Redirecting to sales history after sale");
      navigate("/sales-history");
      
    } catch (error) {
      console.error("Error recording sale:", error);
      toast({
        title: t("common.error"),
        description: t("sell.saleRecordingFailed"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-temple-background">
        <MobileHeader 
          title={t("common.sellBook")}
          showBackButton={true}
          backTo="/books"
        />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-temple-background">
        <MobileHeader 
          title={t("common.sellBook")}
          showBackButton={true}
          backTo="/books"
        />
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">{t("common.bookNotFound")}</p>
        </div>
      </div>
    );
  }

  const totalAmount = book.salePrice * quantity;

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.sellBook")}
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Book Details Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="w-20 h-28 flex-shrink-0">
                <BookImage
                  imageUrl={book.imageUrl}
                  alt={`${book.name} cover`}
                  size="small"
                  className="w-full h-full"
                />
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{book.name}</h2>
                <p className="text-muted-foreground mb-1">{book.author}</p>
                <p className="text-sm text-muted-foreground mb-2">{book.category}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-green-600">₹{book.salePrice}</span>
                  <span className="text-sm text-muted-foreground">
                    {t("common.available")}: {book.quantity}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sale Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("sell.saleDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="quantity">{t("common.quantity")}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={book.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(book.quantity, parseInt(e.target.value) || 1)))}
                className="mt-1"
              />
            </div>

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

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>{t("sell.total")}</span>
                <span className="text-green-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              onClick={handleSale}
              disabled={isProcessing || book.quantity === 0}
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
      </main>
    </div>
  );
};

export default SellBookPage;
