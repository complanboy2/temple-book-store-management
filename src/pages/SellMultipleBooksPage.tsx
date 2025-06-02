
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trash2, ShoppingCart } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import BookImage from "@/components/BookImage";

interface Book {
  id: string;
  name: string;
  author: string;
  salePrice: number;
  quantity: number;
  imageUrl?: string;
  bookCode?: string;
}

interface CartItem {
  book: Book;
  quantity: number;
  subtotal: number;
}

const SellMultipleBooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { toast } = useToast();
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchBooks();
  }, [currentStore]);

  const fetchBooks = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('books')
        .select('id, name, author, saleprice, quantity, imageurl, barcode')
        .eq('stallid', currentStore)
        .gt('quantity', 0)
        .order('name');

      if (error) throw error;

      const formattedBooks: Book[] = (data || []).map(book => ({
        id: book.id,
        name: book.name,
        author: book.author,
        salePrice: book.saleprice || 0,
        quantity: book.quantity || 0,
        imageUrl: book.imageurl,
        bookCode: book.barcode || `BOOK-${book.id.slice(-6).toUpperCase()}`
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

  const filteredBooks = books.filter(book => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const nameMatch = book.name.toLowerCase().includes(searchLower);
    const authorMatch = book.author.toLowerCase().includes(searchLower);
    const bookCodeMatch = book.bookCode?.toLowerCase().includes(searchLower);
    const idMatch = book.id.toLowerCase().includes(searchLower);
    
    return nameMatch || authorMatch || bookCodeMatch || idMatch;
  });

  const addBookToCart = (bookId: string) => {
    const selectedBook = books.find(book => book.id === bookId);
    if (!selectedBook) return;

    const existingItem = cart.find(item => item.book.id === selectedBook.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > selectedBook.quantity) {
        toast({
          title: t("common.error"),
          description: t("sellMultiple.exceedsStock"),
          variant: "destructive",
        });
        return;
      }
      
      setCart(cart.map(item =>
        item.book.id === selectedBook.id
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * selectedBook.salePrice }
          : item
      ));
    } else {
      const cartItem: CartItem = {
        book: selectedBook,
        quantity: 1,
        subtotal: selectedBook.salePrice
      };
      setCart([...cart, cartItem]);
    }

    toast({
      title: t("common.success"),
      description: `${selectedBook.name} ${t("sellMultiple.addedToCart")}`,
    });
  };

  const removeFromCart = (bookId: string) => {
    setCart(cart.filter(item => item.book.id !== bookId));
  };

  const updateQuantity = (bookId: string, newQuantity: number) => {
    const item = cart.find(item => item.book.id === bookId);
    if (!item) return;

    if (newQuantity > item.book.quantity) {
      toast({
        title: t("common.error"),
        description: t("sellMultiple.exceedsStock"),
        variant: "destructive",
      });
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(bookId);
      return;
    }

    setCart(cart.map(cartItem =>
      cartItem.book.id === bookId
        ? { ...cartItem, quantity: newQuantity, subtotal: newQuantity * cartItem.book.salePrice }
        : cartItem
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSell = async () => {
    if (cart.length === 0) {
      toast({
        title: t("common.error"),
        description: t("sellMultiple.addBooksToCart"),
        variant: "destructive",
      });
      return;
    }

    if (!currentStore || !currentUser) {
      toast({
        title: t("common.error"),
        description: t("common.missingRequiredInformation"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const currentTimestamp = new Date().toISOString();
      
      for (const item of cart) {
        const { error: saleError } = await supabase
          .from('sales')
          .insert({
            bookid: item.book.id,
            quantity: item.quantity,
            totalamount: item.subtotal,
            paymentmethod: paymentMethod,
            buyername: buyerName.trim() || null,
            buyerphone: buyerPhone.trim() || null,
            personnelid: currentUser.id,
            stallid: currentStore,
            createdat: currentTimestamp
          });

        if (saleError) throw saleError;

        const { error: updateError } = await supabase
          .from('books')
          .update({
            quantity: item.book.quantity - item.quantity,
            updatedat: currentTimestamp
          })
          .eq('id', item.book.id);

        if (updateError) throw updateError;
      }

      toast({
        title: t("common.success"),
        description: t("sellMultiple.soldSuccessfully"),
      });

      setCart([]);
      setBuyerName("");
      setBuyerPhone("");
      setPaymentMethod("UPI");
      
      fetchBooks();

    } catch (error) {
      console.error("Error selling books:", error);
      toast({
        title: t("common.error"),
        description: t("sellMultiple.errorSelling"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBookOption = (book: Book) => (
    <div 
      className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded p-2"
      onClick={() => addBookToCart(book.id)}
    >
      <div className="w-8 h-10 flex-shrink-0">
        <BookImage 
          imageUrl={book.imageUrl} 
          alt={book.name}
          className="w-full h-full rounded-sm object-cover"
          size="small"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{book.name}</p>
        <p className="text-xs text-gray-600">{book.author}</p>
        <p className="text-xs text-gray-500">
          {book.bookCode} • ₹{book.salePrice} • {book.quantity} {t("common.available")}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title={t("sellMultiple.sellMultipleBooks")}
        showBackButton={true}
        backTo="/"
      />
      
      <main className="container mx-auto px-3 py-4">
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("sellMultiple.selectBooksToSell")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">{t("common.searchByCodeNameAuthor")}</Label>
              <Input
                id="search"
                placeholder={t("common.searchByCodeNameAuthor")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            {searchTerm.trim() && (
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {filteredBooks.length > 0 ? (
                  filteredBooks.map(book => (
                    <div key={book.id}>
                      {renderBookOption(book)}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {t("common.noBooks")}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              {t("sellMultiple.cart")} ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t("sellMultiple.cartEmpty")}</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.book.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-16 flex-shrink-0">
                      <BookImage 
                        imageUrl={item.book.imageUrl} 
                        alt={item.book.name}
                        className="w-full h-full rounded"
                        size="small"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.book.name}</h4>
                      <p className="text-xs text-gray-600">{item.book.author}</p>
                      <p className="text-sm font-medium text-green-600">₹{item.subtotal.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.book.id, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeFromCart(item.book.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>{t("common.total")}:</span>
                    <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {cart.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("sellMultiple.buyerInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="buyerName" className="text-sm font-medium">{t("common.buyerName")} ({t("common.optional")})</Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder={t("common.enterBuyerName")}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="buyerPhone" className="text-sm font-medium">{t("common.buyerPhone")} ({t("common.optional")})</Label>
                <Input
                  id="buyerPhone"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder={t("common.enterBuyerPhone")}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod" className="text-sm font-medium">{t("common.paymentMethod")}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Cash">{t("common.cash")}</SelectItem>
                    <SelectItem value="Card">{t("common.card")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSell}
                className="w-full bg-green-600 hover:bg-green-700 h-12"
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? t("common.processing") : `${t("sellMultiple.sellAll")} - ₹${getTotalAmount().toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SellMultipleBooksPage;
