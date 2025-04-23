
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getBooks, addSale, updateBookQuantity, generateId, getAuthorSalePercentage } from "@/services/storageService";
import { Book, Sale } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/MobileHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useStallContext } from "@/contexts/StallContext";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const SellBookPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authorPercentage, setAuthorPercentage] = useState<number | null>(null);
  const { currentUser } = useAuth();
  const { currentStore } = useStallContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) return;

      try {
        console.log(`Fetching book with ID: ${bookId}`);
        
        // Try to fetch from Supabase first
        const { data: supabaseBook, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", bookId)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching book from Supabase:", error);
          // Fall back to local storage
          const books = getBooks();
          const foundBook = books.find(b => b.id === bookId);
          
          if (foundBook) {
            console.log("Found book in local storage:", foundBook);
            setBook(foundBook);
            
            // Get author percentage if available
            const percentages = getAuthorSalePercentage();
            if (percentages[foundBook.author]) {
              setAuthorPercentage(percentages[foundBook.author]);
            }
          } else {
            console.error("Book not found in local storage either");
            toast({
              title: t("common.error"),
              description: t("common.bookNotFound"),
              variant: "destructive",
            });
            navigate("/books");
          }
        } else if (supabaseBook) {
          console.log("Found book in Supabase:", supabaseBook);
          
          // Transform supabase book to local Book type
          const bookData: Book = {
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
            imageUrl: supabaseBook.imageurl || undefined, // Fixed field name here
            createdAt: supabaseBook.createdat ? new Date(supabaseBook.createdat) : new Date(),
            updatedAt: supabaseBook.updatedat ? new Date(supabaseBook.updatedat) : new Date()
          };
          
          setBook(bookData);
          
          // Get author percentage if available
          const percentages = getAuthorSalePercentage();
          if (percentages[bookData.author]) {
            setAuthorPercentage(percentages[bookData.author]);
          }
        } else {
          console.error("Book not found in Supabase");
          // Fall back to local storage
          const books = getBooks();
          const foundBook = books.find(b => b.id === bookId);
          
          if (foundBook) {
            console.log("Found book in local storage:", foundBook);
            setBook(foundBook);
            
            // Get author percentage if available
            const percentages = getAuthorSalePercentage();
            if (percentages[foundBook.author]) {
              setAuthorPercentage(percentages[foundBook.author]);
            }
          } else {
            console.error("Book not found in local storage either");
            toast({
              title: t("common.error"),
              description: t("common.bookNotFound"),
              variant: "destructive",
            });
            navigate("/books");
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching book:", err);
        toast({
          title: t("common.error"),
          description: t("common.unexpectedError"),
          variant: "destructive",
        });
        navigate("/books");
      }
    };
    
    fetchBook();
  }, [bookId, navigate, toast, t]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && book && value <= book.quantity) {
      setQuantity(value);
    }
  };

  const handleSell = async () => {
    if (!book || !currentUser) return;
    
    setIsLoading(true);
    
    try {
      // Create sale record
      const saleId = crypto.randomUUID();
      const sale: Sale = {
        id: saleId,
        bookId: book.id,
        quantity,
        totalAmount: book.salePrice * quantity,
        paymentMethod,
        buyerName: buyerName || undefined,
        buyerPhone: buyerPhone || undefined,
        personnelId: currentUser.id,
        stallId: book.stallId,
        createdAt: new Date(),
        synced: false,
      };
      
      // Update book quantity in Supabase
      const newQuantity = book.quantity - quantity;
      const { error: updateError } = await supabase
        .from('books')
        .update({ quantity: newQuantity, updatedat: new Date().toISOString() })
        .eq('id', book.id);
      
      if (updateError) {
        console.error("Error updating book quantity in Supabase:", updateError);
        // Continue with local storage as fallback
      } else {
        console.log(`Updated book quantity in Supabase to ${newQuantity}`);
      }
      
      // Add sale to Supabase
      const { error: saleError } = await supabase
        .from('sales')
        .insert([{
          id: sale.id,
          bookid: sale.bookId,
          quantity: sale.quantity,
          totalamount: sale.totalAmount,
          paymentmethod: sale.paymentMethod,
          buyername: sale.buyerName || null,
          buyerphone: sale.buyerPhone || null,
          personnelid: sale.personnelId,
          stallid: sale.stallId,
          createdat: new Date().toISOString(),
          synced: true
        }]);
        
      if (saleError) {
        console.error("Error adding sale to Supabase:", saleError);
        // Fall back to local storage
        sale.synced = false;
      } else {
        console.log("Sale added to Supabase successfully");
        sale.synced = true;
      }
      
      // Add sale to local storage
      addSale(sale);
      
      // Update book quantity locally
      updateBookQuantity(book.id, -quantity);
      
      // Show success toast
      toast({
        title: t("common.saleCompleted"),
        description: `${quantity} ${t("common.copiesOf")} "${book.name}" ${t("common.soldSuccessfully")}.`,
      });
      
      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      console.error("Error processing sale:", error);
      toast({
        title: t("common.saleFailed"),
        description: t("common.errorProcessingSale"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-temple-background">
        <MobileHeader 
          title={t("common.loading")} 
          showBackButton={true}
          backTo="/books"
        />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-lg">{t("common.loading")}...</p>
        </div>
      </div>
    );
  }

  const totalAmount = book.salePrice * quantity;
  const placeholderImage = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=300&h=400&fit=crop";

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.sellBook")} 
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="temple-card">
            <CardHeader>
              <CardTitle className="text-2xl text-temple-maroon">{book.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Book Image */}
              {(book.imageUrl || true) && (
                <div className="mb-4 rounded-md overflow-hidden bg-gray-100 max-w-[200px] mx-auto">
                  <AspectRatio ratio={3/4} className="bg-muted">
                    <img 
                      src={book.imageUrl || placeholderImage} 
                      alt={book.name}
                      className="object-cover w-full h-full rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = placeholderImage;
                      }}
                    />
                  </AspectRatio>
                </div>
              )}
            
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.author")}</p>
                  <p className="font-medium">{book.author}</p>
                  {authorPercentage && (
                    <p className="text-xs text-temple-saffron">{authorPercentage}% royalty</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.category")}</p>
                  <p className="font-medium">{book.category || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.price")}</p>
                  <p className="font-bold text-temple-saffron">₹{book.salePrice}</p>
                  {book.originalPrice && book.originalPrice !== book.salePrice && (
                    <p className="text-xs line-through text-gray-500">₹{book.originalPrice}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.available")}</p>
                  <p className="font-medium">{book.quantity} {t("common.copies")}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">{t("common.printingInstitute")}</p>
                <p>{book.printingInstitute}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="temple-card">
            <CardHeader>
              <CardTitle className="text-2xl text-temple-maroon">{t("common.completeSale")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-lg font-medium">
                    {t("common.quantity")}
                  </label>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      max={book.quantity}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="temple-input mx-2 text-center w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => quantity < book.quantity && setQuantity(quantity + 1)}
                      disabled={quantity >= book.quantity}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="paymentMethod" className="text-lg font-medium">
                    {t("common.paymentMethod")}
                  </label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("common.selectPaymentMethod")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{t("common.cash")}</SelectItem>
                      <SelectItem value="upi">{t("common.upi")}</SelectItem>
                      <SelectItem value="card">{t("common.card")}</SelectItem>
                      <SelectItem value="other">{t("common.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="buyerName" className="text-lg font-medium">
                    {t("common.buyerName")} ({t("common.optional")})
                  </label>
                  <input
                    id="buyerName"
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="temple-input w-full"
                    placeholder={t("common.enterBuyerName")}
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="buyerPhone" className="text-lg font-medium">
                    {t("common.buyerPhone")} ({t("common.optional")})
                  </label>
                  <input
                    id="buyerPhone"
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="temple-input w-full"
                    placeholder={t("common.enterBuyerPhone")}
                  />
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">{t("common.totalAmount")}:</span>
                    <span className="text-2xl font-bold text-temple-maroon">₹{totalAmount}</span>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleSell}
                    disabled={isLoading || book.quantity < 1}
                    className="temple-button w-full"
                  >
                    {isLoading ? t("common.processing") : t("common.completeSale")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SellBookPage;
