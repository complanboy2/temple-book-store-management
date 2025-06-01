
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateId } from "@/services/storageService";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";
import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { Book } from "@/types";

interface CartItem {
  book: Book;
  quantity: number;
}

const SellMultipleBooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    fetchBooks();
  }, [currentStore]);

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
        bookCode: (index + 1).toString(),
        name: book.name,
        author: book.author,
        category: book.category || "",
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
    }
  };

  const filteredBooks = books.filter(book =>
    book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.bookCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const existingItem = cart.find(item => item.book.id === bookId);
    if (existingItem) {
      if (existingItem.quantity < book.quantity) {
        setCart(cart.map(item =>
          item.book.id === bookId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast({
          title: t("common.error"),
          description: t("sell.notEnoughStock"),
          variant: "destructive",
        });
      }
    } else {
      setCart([...cart, { book, quantity: 1 }]);
    }
  };

  const updateQuantity = (bookId: string, newQuantity: number) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.book.id !== bookId));
    } else if (newQuantity <= book.quantity) {
      setCart(cart.map(item =>
        item.book.id === bookId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      toast({
        title: t("common.error"),
        description: t("sell.notEnoughStock"),
        variant: "destructive",
      });
    }
  };

  const removeFromCart = (bookId: string) => {
    setCart(cart.filter(item => item.book.id !== bookId));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.book.salePrice * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast({
        title: t("common.error"),
        description: t("sell.addBooksToCart"),
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: t("common.error"),
        description: t("sell.selectPaymentMethod"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      for (const item of cart) {
        const saleId = generateId();
        
        // Record the sale
        const { error: saleError } = await supabase
          .from('sales')
          .insert({
            id: saleId,
            bookid: item.book.id,
            quantity: item.quantity,
            totalamount: item.book.salePrice * item.quantity,
            paymentmethod: paymentMethod,
            buyername: buyerName || null,
            buyerphone: buyerPhone || null,
            personnelid: currentUser?.id || '',
            stallid: currentStore,
            createdat: new Date().toISOString()
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

      toast({
        title: t("common.success"),
        description: t("sell.saleCompleted"),
      });

      // Reset form
      setCart([]);
      setBuyerName("");
      setBuyerPhone("");
      setPaymentMethod("UPI");
      setSelectedBook("");
      
      // Refresh books
      fetchBooks();

    } catch (error) {
      console.error("Error completing sale:", error);
      toast({
        title: t("common.error"),
        description: t("sell.saleError"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("sell.sellMultipleBooks")}
        showBackButton={true}
        backTo="/"
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Book Selection */}
        <Card className="temple-card">
          <CardHeader>
            <CardTitle>{t("sell.selectBooks")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">{t("common.searchBooks")}</Label>
              <Input
                id="search"
                placeholder={t("common.searchByCodeNameAuthor")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
              {filteredBooks.map((book) => (
                <div key={book.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => addToCart(book.id)}>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{book.name}</h4>
                    <p className="text-xs text-gray-600">{book.author}</p>
                    <p className="text-xs text-temple-maroon">₹{book.salePrice} • {book.quantity} {t("common.available")}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shopping Cart */}
        <Card className="temple-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t("sell.shoppingCart")} ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 py-4">{t("sell.emptyCart")}</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.book.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.book.name}</h4>
                      <p className="text-xs text-gray-600">{item.book.author}</p>
                      <p className="text-xs text-temple-maroon">₹{item.book.salePrice} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.book.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.book.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600"
                        onClick={() => removeFromCart(item.book.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t("sell.total")}:</span>
                    <span className="font-semibold text-lg text-temple-maroon">₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sale Details */}
        <Card className="temple-card">
          <CardHeader>
            <CardTitle>{t("sell.saleDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="buyerName">{t("sell.buyerName")}</Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder={t("sell.enterBuyerName")}
                />
              </div>

              <div>
                <Label htmlFor="buyerPhone">{t("sell.buyerPhone")}</Label>
                <Input
                  id="buyerPhone"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder={t("sell.enterBuyerPhone")}
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">{t("sell.paymentMethod")} *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("sell.selectPaymentMethod")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">{t("sell.upi")}</SelectItem>
                    <SelectItem value="Cash">{t("sell.cash")}</SelectItem>
                    <SelectItem value="Card">{t("sell.card")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-temple-maroon hover:bg-temple-maroon/90"
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? t("common.processing") : `${t("sell.completeSale")} - ₹${getTotalAmount().toFixed(2)}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SellMultipleBooksPage;
