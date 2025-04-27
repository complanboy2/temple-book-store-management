import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/types";
import { generateId } from "@/services/storageService";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { crypto } from "crypto";

const SellBookPage: React.FC = () => {
  const [book, setBook] = useState<Book | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    // Auto-fill buyer information from current user
    if (currentUser) {
      setBuyerName(currentUser.name || "");
      setBuyerPhone(currentUser.phone || "");
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchBook = async () => {
      const bookId = params.bookId;
      
      if (!bookId || !currentStore) {
        toast({
          title: t("common.error"),
          description: t("common.bookNotFound"),
          variant: "destructive",
        });
        navigate('/books');
        return;
      }

      setIsLoading(true);
      try {
        const { data: supabaseBook, error } = await supabase
          .from('books')
          .select('*')
          .eq('id', bookId)
          .eq('stallid', currentStore)
          .single();
        
        if (error || !supabaseBook) {
          console.error("Error fetching book:", error);
          toast({
            title: t("common.error"),
            description: t("common.bookNotFound"),
            variant: "destructive",
          });
          navigate('/books');
          return;
        }

        const formattedBook: Book = {
          id: supabaseBook.id,
          barcode: supabaseBook.barcode || undefined,
          name: supabaseBook.name,
          author: supabaseBook.author,
          category: supabaseBook.category || "",
          printingInstitute: supabaseBook.printinginstitute || "",
          originalPrice: supabaseBook.originalprice,
          salePrice: supabaseBook.saleprice,
          quantity: supabaseBook.quantity,
          stallId: supabaseBook.stallid,
          imageUrl: supabaseBook.imageurl,
          createdAt: supabaseBook.createdat ? new Date(supabaseBook.createdat) : new Date(),
          updatedAt: supabaseBook.updatedat ? new Date(supabaseBook.updatedat) : new Date()
        };
        
        setBook(formattedBook);
      } catch (error) {
        console.error("Fetch error:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBookDetails"),
          variant: "destructive",
        });
        navigate('/books');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [params.bookId, currentStore, navigate, toast]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (book && value > book.quantity) {
      setQuantity(book.quantity);
    } else {
      setQuantity(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!book || !currentStore || !currentUser) {
      toast({
        title: t("common.error"),
        description: t("common.missingRequiredInformation"),
        variant: "destructive",
      });
      return;
    }
    
    if (quantity > book.quantity) {
      toast({
        title: t("common.error"),
        description: t("common.notEnoughBooks"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Starting sale process for book:", book.id);
      const saleId = crypto.randomUUID();
      const totalAmount = book.salePrice * quantity;
      
      const saleDate = new Date();
      const currentTimestamp = saleDate.toISOString();
      
      // First update book quantity to prevent race conditions
      const { error: updateError } = await supabase
        .from('books')
        .update({ 
          quantity: book.quantity - quantity, 
          updatedat: currentTimestamp
        })
        .eq('id', book.id);
        
      if (updateError) {
        console.error("Error updating book quantity:", updateError);
        throw new Error(t("sell.failedToUpdateInventory"));
      }
      
      console.log("Book inventory updated:", bookData);
      
      // Then record the sale with more robust error handling
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          id: saleId,
          bookid: book.id,
          quantity: quantity,
          totalamount: totalAmount,
          paymentmethod: paymentMethod,
          buyername: buyerName || currentUser.name,
          buyerphone: buyerPhone || currentUser.phone,
          personnelid: currentUser.id,
          stallid: currentStore,
          synced: true,
          createdat: currentTimestamp
        });
      
      if (saleError) {
        console.error("Error creating sale:", saleError);
        // Revert the quantity change
        await supabase
          .from('books')
          .update({ quantity: book.quantity, updatedat: new Date().toISOString() })
          .eq('id', book.id);
          
        throw new Error(t("sell.failedToRecordSale"));
      }
      
      console.log("Sale recorded successfully:", saleData);

      toast({
        title: t("common.success"),
        description: t("sell.saleCompleted"),
      });
      
      navigate('/sales');
    } catch (error) {
      console.error("Sale submission error:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("sell.failedToCompleteSale"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-temple-background">
        <p>{t("common.loading")}...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-temple-background">
        <p>{t("common.bookNotFound")}</p>
        <Button className="mt-4" onClick={() => navigate('/books')}>
          {t("common.backToBooks")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("sell.title")}
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-2 py-4 pb-20">
        {!isMobile && (
          <h1 className="text-2xl font-bold text-temple-maroon mb-4">{t("sell.title")}</h1>
        )}
        
        <Card className="temple-card">
          <CardHeader>
            <CardTitle className="text-lg text-temple-maroon">{book.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.author")}: {book.author}</p>
                  {book.category && (
                    <p className="text-sm text-muted-foreground">{t("common.category")}: {book.category}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{t("common.availableQuantity")}: {book.quantity}</p>
                </div>
                <div>
                  <p className="font-medium text-lg text-temple-saffron">₹{book.salePrice}</p>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">{t("common.quantity")}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    min={1}
                    max={book.quantity}
                    className="max-w-xs"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>{t("sell.paymentMethod")}</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="flex flex-wrap gap-4"
                  >
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
                
                <div className="grid gap-2">
                  <Label htmlFor="buyerName">{t("sell.buyerName")} ({t("common.optional")})</Label>
                  <Input
                    id="buyerName"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="buyerPhone">{t("sell.buyerPhone")} ({t("common.optional")})</Label>
                  <Input
                    id="buyerPhone"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-medium">{t("common.total")}</p>
                    <p className="font-bold text-xl text-temple-maroon">₹{(book.salePrice * quantity).toFixed(2)}</p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || book.quantity === 0}
                  >
                    {isSubmitting ? `${t("common.processing")}...` : t("sell.completeSale")}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SellBookPage;
