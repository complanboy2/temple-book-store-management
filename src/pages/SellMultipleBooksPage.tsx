
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types';
import { useStallContext } from '@/contexts/StallContext';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MinusCircle, PlusCircle, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface CartItem {
  book: Book;
  quantity: number;
}

const SellMultipleBooksPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth(); // Using currentUser instead of user
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentStore) {
      toast({
        title: t("common.error"),
        description: t("common.selectStallFirst"),
        variant: "destructive",
      });
      navigate('/');
    }
  }, [currentStore, navigate, t, toast]);

  // Search for books as user types
  useEffect(() => {
    const searchBooks = async () => {
      if (!searchQuery || searchQuery.length < 2 || !currentStore) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('stallid', currentStore)
          .or(`name.ilike.%${searchQuery}%, barcode.ilike.%${searchQuery}%, author.ilike.%${searchQuery}%`)
          .limit(10);
          
        if (error) throw error;
        
        const formattedBooks = data.map(book => ({
          id: book.id,
          barcode: book.barcode,
          name: book.name,
          author: book.author,
          category: book.category,
          printingInstitute: book.printinginstitute,
          originalPrice: book.originalprice,
          salePrice: book.saleprice,
          quantity: book.quantity,
          stallId: book.stallid,
          imageUrl: book.imageurl,
          createdAt: new Date(book.createdat),
          updatedAt: new Date(book.updatedat)
        }));
        
        setSearchResults(formattedBooks);
      } catch (error) {
        console.error("Error searching books:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBooks"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(searchBooks, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentStore, toast, t]);

  const addToCart = (book: Book) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.book.id === book.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.book.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { book, quantity: 1 }];
      }
    });
    
    toast({
      title: t("common.added"),
      description: `${book.name} ${t("common.addedToCart")}`,
    });
    
    // Clear search after adding
    setSearchQuery('');
    setSearchResults([]);
  };

  const increaseQuantity = (bookId: string) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.book.id === bookId) {
          const newQuantity = Math.min(item.quantity + 1, item.book.quantity);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const decreaseQuantity = (bookId: string) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.book.id === bookId) {
          const newQuantity = Math.max(1, item.quantity - 1);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (bookId: string) => {
    setCart(prevCart => prevCart.filter(item => item.book.id !== bookId));
    
    toast({
      title: t("common.removed"),
      description: t("common.removedFromCart"),
    });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.book.salePrice * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: t("common.emptyCart"),
        description: t("common.addBooksToCart"),
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Process each item as a separate sale
      for (const item of cart) {
        const sale = {
          bookid: item.book.id,
          quantity: item.quantity,
          totalamount: item.book.salePrice * item.quantity,
          paymentmethod: paymentMethod,
          buyername: buyerName || null,
          buyerphone: buyerPhone || null,
          personnelid: currentUser?.id, // Using currentUser?.id instead of user?.id
          stallid: currentStore,
          synced: false
        };
        
        // 1. Insert the sale
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert([sale])
          .select();
          
        if (saleError) throw saleError;
        
        // 2. Update book quantity
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
        description: t("common.saleComplete"),
      });
      
      // Reset the form
      setCart([]);
      setPaymentMethod('cash');
      setBuyerName('');
      setBuyerPhone('');
      
    } catch (error) {
      console.error("Error processing checkout:", error);
      toast({
        title: t("common.error"),
        description: t("common.saleError"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-temple-maroon mb-6">
          {t("common.sellMultipleBooks")}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search and results */}
          <Card>
            <CardHeader>
              <CardTitle>{t("common.searchBooks")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder={t("common.searchByNameOrBarcode")}
                    className="pl-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                {isLoading ? (
                  <p className="text-center py-4 text-gray-500">{t("common.loading")}...</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      <div className="w-full overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">{t("common.image")}</TableHead>
                              <TableHead>{t("common.name")}</TableHead>
                              <TableHead className="w-20">{t("common.price")}</TableHead>
                              <TableHead className="w-20">{t("common.stock")}</TableHead>
                              <TableHead className="w-20 text-right">{t("common.action")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {searchResults.map(book => (
                              <TableRow key={book.id}>
                                <TableCell className="align-top">
                                  {book.imageUrl ? (
                                    <div className="w-12 h-12 overflow-hidden rounded-md">
                                      <AspectRatio ratio={1/1}>
                                        <img 
                                          src={book.imageUrl} 
                                          alt={book.name} 
                                          className="object-cover w-full h-full"
                                        />
                                      </AspectRatio>
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                                      <span className="text-xs text-gray-400">No image</span>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="align-top">
                                  <div>
                                    <p className="font-medium line-clamp-2">{book.name}</p>
                                    <p className="text-sm text-gray-500 line-clamp-1">{book.author}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="align-top">₹{book.salePrice}</TableCell>
                                <TableCell className="align-top">
                                  <span className={book.quantity <= 0 ? "text-red-500" : ""}>
                                    {book.quantity}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right align-top">
                                  <Button 
                                    size="sm" 
                                    variant={book.quantity <= 0 ? "outline" : "default"}
                                    onClick={() => addToCart(book)}
                                    disabled={book.quantity <= 0}
                                    className="px-2 py-1 h-auto"
                                  >
                                    {book.quantity <= 0 ? t("common.outOfStock") : t("common.add")}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      searchQuery.length >= 2 && (
                        <p className="text-center py-4 text-gray-500">
                          {t("common.noResults")}
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Cart and checkout */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t("common.cart")}
                <span className="ml-2 text-sm text-gray-500">
                  ({cart.length} {t("common.items")})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.image")}</TableHead>
                        <TableHead>{t("common.book")}</TableHead>
                        <TableHead>{t("common.price")}</TableHead>
                        <TableHead>{t("common.quantity")}</TableHead>
                        <TableHead className="text-right">{t("common.subtotal")}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map(item => (
                        <TableRow key={item.book.id}>
                          <TableCell className="w-16">
                            {item.book.imageUrl ? (
                              <div className="w-10 h-10 overflow-hidden rounded-md">
                                <AspectRatio ratio={1/1}>
                                  <img 
                                    src={item.book.imageUrl} 
                                    alt={item.book.name} 
                                    className="object-cover w-full h-full"
                                  />
                                </AspectRatio>
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                                <span className="text-xs text-gray-400">No img</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{item.book.name}</p>
                          </TableCell>
                          <TableCell>₹{item.book.salePrice}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => decreaseQuantity(item.book.id)}
                              >
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                              <span>{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => increaseQuantity(item.book.id)}
                                disabled={item.quantity >= item.book.quantity}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(item.book.salePrice * item.quantity).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6 text-red-500"
                              onClick={() => removeFromCart(item.book.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t("common.cartEmpty")}</p>
                  <p className="text-gray-400 text-sm">{t("common.searchAndAddBooks")}</p>
                </div>
              )}
              
              {cart.length > 0 && (
                <>
                  <Separator className="my-4" />
                  
                  <div className="space-y-4 mt-4">
                    <div className="flex justify-between font-medium">
                      <span>{t("common.total")}</span>
                      <span>₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="paymentMethod">{t("common.paymentMethod")}</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger id="paymentMethod">
                            <SelectValue placeholder={t("common.selectPayment")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">{t("common.cash")}</SelectItem>
                            <SelectItem value="upi">{t("common.upi")}</SelectItem>
                            <SelectItem value="card">{t("common.card")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="buyerName">{t("common.buyerName")}</Label>
                          <Input
                            id="buyerName"
                            value={buyerName}
                            onChange={e => setBuyerName(e.target.value)}
                            placeholder={t("common.optional")}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="buyerPhone">{t("common.buyerPhone")}</Label>
                          <Input
                            id="buyerPhone"
                            value={buyerPhone}
                            onChange={e => setBuyerPhone(e.target.value)}
                            placeholder={t("common.optional")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleCheckout}
                disabled={cart.length === 0 || isProcessing}
              >
                {isProcessing ? t("common.processing") : t("common.completeSale")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SellMultipleBooksPage;
