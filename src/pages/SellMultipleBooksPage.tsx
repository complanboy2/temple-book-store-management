
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import MobileHeader from "@/components/MobileHeader";
import BookImage from "@/components/BookImage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types";
import { Search, Plus, Minus, Trash2 } from "lucide-react";

interface CartItem {
  book: Book;
  quantity: number;
}

const SellMultipleBooksPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isLoading, setIsLoading] = useState(true);
  const [isSelling, setIsSelling] = useState(false);

  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      if (!currentStore) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("stallid", currentStore)
          .gt("quantity", 0)
          .order("name");

        if (error) throw error;

        const booksData: Book[] = data.map((row: any) => ({
          id: row.id,
          barcode: row.barcode ?? "",
          name: row.name,
          author: row.author,
          category: row.category ?? "",
          printingInstitute: row.printinginstitute ?? "",
          originalPrice: row.originalprice,
          salePrice: row.saleprice,
          quantity: row.quantity,
          stallId: row.stallid,
          imageUrl: row.imageurl,
          createdAt: new Date(row.createdat),
          updatedAt: new Date(row.updatedat)
        }));

        setBooks(booksData);
        setFilteredBooks(booksData);
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
  }, [currentStore, toast, t]);

  // Filter books based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book =>
        book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.barcode && book.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredBooks(filtered);
    }
  }, [searchTerm, books]);

  const addToCart = (book: Book) => {
    const existingItem = cart.find(item => item.book.id === book.id);
    
    if (existingItem) {
      if (existingItem.quantity < book.quantity) {
        setCart(cart.map(item =>
          item.book.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast({
          title: t("common.error"),
          description: t("sell.quantityExceedsStock"),
          variant: "destructive",
        });
      }
    } else {
      setCart([...cart, { book, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (bookId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(bookId);
      return;
    }

    const book = books.find(b => b.id === bookId);
    if (book && newQuantity > book.quantity) {
      toast({
        title: t("common.error"),
        description: t("sell.quantityExceedsStock"),
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map(item =>
      item.book.id === bookId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (bookId: string) => {
    setCart(cart.filter(item => item.book.id !== bookId));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.book.salePrice * item.quantity), 0);
  };

  const handleSell = async () => {
    if (cart.length === 0) {
      toast({
        title: t("common.error"),
        description: t("sell.noItemsInCart"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSelling(true);

      // Process each sale
      for (const item of cart) {
        // Insert sale record
        const { error: saleError } = await supabase
          .from("sales")
          .insert({
            bookid: item.book.id,
            quantity: item.quantity,
            totalamount: item.book.salePrice * item.quantity,
            paymentmethod: paymentMethod,
            buyername: customerName || null,
            buyerphone: customerPhone || null,
            personnelid: currentUser?.id || "unknown",
            stallid: currentStore,
          });

        if (saleError) throw saleError;

        // Update book quantity
        const { error: updateError } = await supabase
          .from("books")
          .update({
            quantity: item.book.quantity - item.quantity,
            updatedat: new Date().toISOString()
          })
          .eq("id", item.book.id);

        if (updateError) throw updateError;
      }

      toast({
        title: t("common.success"),
        description: t("sell.saleCompleted"),
      });

      // Reset form
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMethod("cash");
      
      // Refresh books
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("stallid", currentStore)
        .gt("quantity", 0)
        .order("name");

      if (!error && data) {
        const booksData: Book[] = data.map((row: any) => ({
          id: row.id,
          barcode: row.barcode ?? "",
          name: row.name,
          author: row.author,
          category: row.category ?? "",
          printingInstitute: row.printinginstitute ?? "",
          originalPrice: row.originalprice,
          salePrice: row.saleprice,
          quantity: row.quantity,
          stallId: row.stallid,
          imageUrl: row.imageurl,
          createdAt: new Date(row.createdat),
          updatedAt: new Date(row.updatedat)
        }));
        setBooks(booksData);
      }

    } catch (error) {
      console.error("Error processing sale:", error);
      toast({
        title: t("common.error"),
        description: t("sell.saleProcessingFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader
        title={t("sell.sellMultipleBooks")}
        showBackButton={true}
        backTo="/"
      />

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Search Section */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t("sell.searchBooks")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Books List */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">{t("common.availableBooks")}</h2>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t("common.loading")}...</p>
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => addToCart(book)}
                  >
                    <div className="w-12 h-16 flex-shrink-0">
                      <BookImage
                        imageUrl={book.imageUrl}
                        alt={`${book.name} cover`}
                        size="small"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-1">{book.name}</h3>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-medium">₹{book.salePrice}</span>
                        <Badge variant="secondary" className="text-xs">
                          {book.quantity} {t("common.available")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t("common.noBooksFound")}</p>
              </div>
            )}
          </Card>

          {/* Cart */}
          {cart.length > 0 && (
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">{t("sell.cart")} ({cart.length})</h2>
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div key={item.book.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-10 h-12 flex-shrink-0">
                      <BookImage
                        imageUrl={item.book.imageUrl}
                        alt={`${item.book.name} cover`}
                        size="small"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-1">{item.book.name}</h3>
                      <p className="text-xs text-muted-foreground">₹{item.book.salePrice} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(item.book.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartQuantity(item.book.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.book.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{t("common.total")}</span>
                  <span>₹{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Customer Details */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">{t("sell.customerDetails")}</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">{t("sell.customerName")} ({t("common.optional")})</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t("sell.enterCustomerName")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerPhone">{t("sell.customerPhone")} ({t("common.optional")})</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={t("sell.enterCustomerPhone")}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">{t("sell.paymentMethod")}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t("sell.cash")}</SelectItem>
                    <SelectItem value="card">{t("sell.card")}</SelectItem>
                    <SelectItem value="upi">{t("sell.upi")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSell}
              disabled={cart.length === 0 || isSelling}
              className="flex-1"
            >
              {isSelling ? t("sell.processing") : `${t("sell.completeSale")} ₹${getTotalAmount().toFixed(2)}`}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellMultipleBooksPage;
