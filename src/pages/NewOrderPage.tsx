
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import MobileHeader from "@/components/MobileHeader";

interface Book {
  id: string;
  name: string;
  author: string;
  saleprice: number;
  quantity: number;
}

interface OrderItem {
  bookId: string;
  bookName: string;
  author: string;
  price: number;
  availableStock: number;
  quantity: number;
}

const NewOrderPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentStore } = useStallContext();
  const [books, setBooks] = useState<Book[]>([]);
  const [lowStockBooks, setLowStockBooks] = useState<Book[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBooks();
    fetchLowStockBooks();
  }, [currentStore]);

  const fetchBooks = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("stallid", currentStore)
        .gt("quantity", 0);

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast({
        title: "Error",
        description: "Failed to load books",
        variant: "destructive",
      });
    }
  };

  const fetchLowStockBooks = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("stallid", currentStore)
        .lt("quantity", 5)
        .gt("quantity", 0);

      if (error) throw error;
      setLowStockBooks(data || []);
    } catch (error) {
      console.error("Error fetching low stock books:", error);
    }
  };

  const addLowStockBooks = () => {
    const newItems: OrderItem[] = lowStockBooks
      .filter(book => !orderItems.some(item => item.bookId === book.id))
      .map(book => ({
        bookId: book.id,
        bookName: book.name,
        author: book.author,
        price: book.saleprice,
        availableStock: book.quantity,
        quantity: Math.max(5 - book.quantity, 1), // Order enough to reach 5 stock
      }));

    setOrderItems(prev => [...prev, ...newItems]);
    
    toast({
      title: "Low Stock Books Added",
      description: `Added ${newItems.length} low stock books to the order`,
    });
  };

  const addBookToOrder = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (orderItems.some(item => item.bookId === bookId)) {
      toast({
        title: "Book Already Added",
        description: "This book is already in the order",
        variant: "destructive",
      });
      return;
    }

    const newItem: OrderItem = {
      bookId: book.id,
      bookName: book.name,
      author: book.author,
      price: book.saleprice,
      availableStock: book.quantity,
      quantity: 1,
    };

    setOrderItems(prev => [...prev, newItem]);
  };

  const updateItemQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(bookId);
      return;
    }

    setOrderItems(prev =>
      prev.map(item =>
        item.bookId === bookId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (bookId: string) => {
    setOrderItems(prev => prev.filter(item => item.bookId !== bookId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the order",
        variant: "destructive",
      });
      return;
    }

    if (!customerPhone.trim()) {
      toast({
        title: "Error",
        description: "Customer phone is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          totalamount: calculateTotal(),
          customername: `Customer ${customerPhone}`, // Auto-generate name from phone
          customerphone: customerPhone,
          customeremail: customerEmail || null,
          notes: notes || null,
          status: "pending",
          paymentstatus: "pending",
          stallid: currentStore,
          adminid: currentStore, // Using store ID as admin ID for now
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        orderid: order.id,
        bookid: item.bookId,
        quantity: item.quantity,
        priceatorder: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Order created successfully",
      });

      navigate("/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader title="Create New Order" showBackButton={true} />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={addLowStockBooks}
              className="w-full bg-temple-saffron hover:bg-temple-saffron/90"
              disabled={lowStockBooks.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Low Stock Books ({lowStockBooks.length} available)
            </Button>
            
            <div>
              <Label htmlFor="book-select">Select a Book</Label>
              <select
                id="book-select"
                className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                onChange={(e) => {
                  if (e.target.value) {
                    addBookToOrder(e.target.value);
                    e.target.value = "";
                  }
                }}
              >
                <option value="">Choose a book to add...</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.name} by {book.author} (Stock: {book.quantity})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        {orderItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.bookId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.bookName}</h3>
                      <p className="text-sm text-gray-600">by {item.author}</p>
                      <p className="text-sm text-gray-600">₹{item.price} each</p>
                      <p className="text-sm text-gray-600">Available: {item.availableStock}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        max={item.availableStock}
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.bookId, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.bookId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter customer phone number"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Enter customer email"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special notes for this order"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || orderItems.length === 0}
          className="w-full bg-temple-maroon hover:bg-temple-maroon/90"
        >
          {isSubmitting ? "Creating Order..." : "Create Order"}
        </Button>
      </div>
    </div>
  );
};

export default NewOrderPage;
