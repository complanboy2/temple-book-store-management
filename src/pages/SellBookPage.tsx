
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
    if (bookId) {
      const books = getBooks();
      // Filter books by current stall if available
      let filteredBooks = books;
      if (currentStore) {
        filteredBooks = books.filter(b => b.stallId === currentStore);
      }
      
      const foundBook = filteredBooks.find(b => b.id === bookId);
      if (foundBook) {
        setBook(foundBook);
        
        // Get author percentage if available
        const percentages = getAuthorSalePercentage();
        if (percentages[foundBook.author]) {
          setAuthorPercentage(percentages[foundBook.author]);
        }
      } else {
        toast({
          title: t("common.error"),
          description: t("common.bookNotFound"),
          variant: "destructive",
        });
        navigate("/books");
      }
    }
  }, [bookId, currentStore, navigate, toast, t]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && book && value <= book.quantity) {
      setQuantity(value);
    }
  };

  const handleSell = () => {
    if (!book || !currentUser) return;
    
    setIsLoading(true);
    
    try {
      // Create sale record
      const sale: Sale = {
        id: generateId(),
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
      
      // Add sale to storage
      addSale(sale);
      
      // Update book quantity
      updateBookQuantity(book.id, -quantity);
      
      // Show success toast
      toast({
        title: t("common.saleCompleted"),
        description: `${quantity} ${t("common.copiesOf")} "${book.name}" ${t("common.soldSuccessfully")}.`,
      });
      
      // Navigate to dashboard
      navigate("/");
    } catch (error) {
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
