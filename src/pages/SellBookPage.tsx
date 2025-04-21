
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBooks, addSale, updateBookQuantity, generateId } from "@/services/storageService";
import { Book, Sale } from "@/types";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SellBookPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (bookId) {
      const books = getBooks();
      const foundBook = books.find(b => b.id === bookId);
      if (foundBook) {
        setBook(foundBook);
      } else {
        navigate("/books");
      }
    }
  }, [bookId, navigate]);

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
        title: "Sale Completed",
        description: `${quantity} copies of "${book.name}" sold successfully.`,
      });
      
      // Navigate to dashboard
      navigate("/");
    } catch (error) {
      toast({
        title: "Sale Failed",
        description: "An error occurred while processing the sale.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-temple-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const totalAmount = book.salePrice * quantity;

  return (
    <div className="min-h-screen bg-temple-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          ← Back
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="temple-card">
            <CardHeader>
              <CardTitle className="text-2xl text-temple-maroon">{book.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Author</p>
                  <p className="font-medium">{book.author}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{book.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-bold text-temple-saffron">₹{book.salePrice}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="font-medium">{book.quantity} copies</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Printing Institute</p>
                <p>{book.printingInstitute}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="temple-card">
            <CardHeader>
              <CardTitle className="text-2xl text-temple-maroon">Complete Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-lg font-medium">
                    Quantity
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
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="temple-input w-full"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="buyerName" className="text-lg font-medium">
                    Buyer Name (Optional)
                  </label>
                  <input
                    id="buyerName"
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="temple-input w-full"
                    placeholder="Enter buyer name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="buyerPhone" className="text-lg font-medium">
                    Buyer Phone (Optional)
                  </label>
                  <input
                    id="buyerPhone"
                    type="tel"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="temple-input w-full"
                    placeholder="Enter buyer phone"
                  />
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg">Total Amount:</span>
                    <span className="text-2xl font-bold text-temple-maroon">₹{totalAmount}</span>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={handleSell}
                    disabled={isLoading || book.quantity < 1}
                    className="temple-button w-full"
                  >
                    {isLoading ? "Processing..." : "Complete Sale"}
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
