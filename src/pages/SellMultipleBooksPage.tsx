
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Book } from "@/types";
import { generateId } from "@/services/storageService";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import BookImage from "@/components/BookImage";

interface CartItem {
  book: Book;
  quantity: number;
}

const SellMultipleBooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      setSellerName(currentUser.name || "");
    }
  }, [currentUser]);

  useEffect(() => {
    fetchBooks();
  }, [currentStore]);

  const fetchBooks = async () => {
    if (!currentStore) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: supabaseBooks, error } = await supabase
        .from('books')
        .select('*')
        .eq('stallid', currentStore)
        .gt('quantity', 0)
        .order('name');
      
      if (error) {
        console.error("Error fetching books:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBooks"),
          variant: "destructive",
        });
        return;
      }

      const formattedBooks: Book[] = (supabaseBooks || []).map(book => ({
        id: book.id,
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
      console.error("Fetch error:", error);
      toast({
        title: t("common.error"),
        description: t("common.failedToLoadBooks"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (book: Book) => {
    const existingItem = cartItems.find(item => item.book.id === book.id);
    
    if (existingItem) {
      if (existingItem.quantity < book.quantity) {
        setCartItems(prev =>
          prev.map(item =>
            item.book.id === book.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
        toast({
          title: t("common.success"),
          description: `${book.name} quantity updated in cart`,
        });
      } else {
        toast({
          title: t("common.error"),
          description: t("common.notEnoughBooks"),
          variant: "destructive",
        });
      }
    } else {
      setCartItems(prev => [...prev, { book, quantity: 1 }]);
      toast({
        title: t("common.success"),
        description: `${book.name} added to cart`,
      });
    }
  };

  const updateCartItemQuantity = (bookId: string, newQuantity: number) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (newQuantity <= 0) {
      removeFromCart(bookId);
      return;
    }

    if (newQuantity > book.quantity) {
      toast({
        title: t("common.error"),
        description: t("common.notEnoughBooks"),
        variant: "destructive",
      });
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.book.id === bookId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (bookId: string) => {
    setCartItems(prev => prev.filter(item => item.book.id !== bookId));
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.book.salePrice * item.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentStore || !currentUser) {
      toast({
        title: t("common.error"),
        description: t("common.missingRequiredInformation"),
        variant: "destructive",
      });
      return;
    }
    
    if (cartItems.length === 0) {
      toast({
        title: t("common.error"),
        description: "Please add at least one book to cart",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Starting multiple sale process");
      const currentTimestamp = new Date().toISOString();
      
      // Process each cart item
      for (const cartItem of cartItems) {
        const { book, quantity } = cartItem;
        
        // Check if we still have enough stock
        if (quantity > book.quantity) {
          throw new Error(`Not enough stock for ${book.name}`);
        }
        
        // Update book quantity
        const { error: updateError } = await supabase
          .from('books')
          .update({ 
            quantity: book.quantity - quantity, 
            updatedat: currentTimestamp
          })
          .eq('id', book.id);
          
        if (updateError) {
          console.error("Error updating book quantity:", updateError);
          throw new Error(`Failed to update inventory for ${book.name}`);
        }
        
        // Create sale record
        const saleId = generateId();
        const totalAmount = book.salePrice * quantity;
        
        const { error: saleError } = await supabase
          .from('sales')
          .insert({
            id: saleId,
            bookid: book.id,
            quantity: quantity,
            totalamount: totalAmount,
            paymentmethod: paymentMethod,
            buyername: buyerName,
            buyerphone: buyerPhone,
            personnelid: currentUser.id,
            stallid: currentStore,
            synced: true,
            createdat: currentTimestamp
          });
        
        if (saleError) {
          console.error("Error creating sale:", saleError);
          throw new Error(`Failed to record sale for ${book.name}`);
        }
      }
      
      console.log("All sales recorded successfully");

      toast({
        title: t("common.success"),
        description: "All sales completed successfully",
      });
      
      // Clear cart and navigate
      setCartItems([]);
      navigate('/sales');
    } catch (error) {
      console.error("Sale submission error:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : "Failed to complete sales",
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

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title="Sell Multiple Books"
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-2 py-4">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Books Selection */}
          <div>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Available Books</CardTitle>
                <div>
                  <Input
                    placeholder="Search books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {filteredBooks.map((book) => (
                    <div
                      key={book.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => addToCart(book)}
                    >
                      <div className="w-12 h-16 flex-shrink-0">
                        <BookImage
                          imageUrl={book.imageUrl}
                          alt={book.name}
                          size="small"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1">{book.name}</h3>
                        <p className="text-xs text-gray-600 line-clamp-1">{book.author}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-medium text-temple-maroon">₹{book.salePrice}</span>
                          <span className="text-xs text-gray-500">Stock: {book.quantity}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(book);
                        }}
                        className="flex-shrink-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart and Checkout */}
          <div>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Cart ({cartItems.length} items)</CardTitle>
              </CardHeader>
              <CardContent>
                {cartItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No items in cart</p>
                ) : (
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.book.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-10 h-12 flex-shrink-0">
                          <BookImage
                            imageUrl={item.book.imageUrl}
                            alt={item.book.name}
                            size="small"
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">{item.book.name}</h4>
                          <p className="text-xs text-gray-600">₹{item.book.salePrice} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartItemQuantity(item.book.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCartItemQuantity(item.book.id, item.quantity + 1)}
                            disabled={item.quantity >= item.book.quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.book.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>₹{getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Checkout Form */}
            {cartItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Checkout</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="sellerName">{t("sell.sellerName")}</Label>
                      <Input
                        id="sellerName"
                        value={sellerName}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <Label>{t("sell.paymentMethod")}</Label>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                        className="flex flex-wrap gap-4 mt-2"
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
                    
                    <div>
                      <Label htmlFor="buyerName">{t("sell.buyerName")} ({t("common.optional")})</Label>
                      <Input
                        id="buyerName"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Enter buyer's name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="buyerPhone">{t("sell.buyerPhone")} ({t("common.optional")})</Label>
                      <Input
                        id="buyerPhone"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="Enter buyer's phone number"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || cartItems.length === 0}
                    >
                      {isSubmitting ? `${t("common.processing")}...` : t("sell.completeSale")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellMultipleBooksPage;
