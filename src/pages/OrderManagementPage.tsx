import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types";
import { Loader2, CheckCircle, AlertTriangle, Plus, Trash } from "lucide-react";
import { generateId } from "@/services/storageService";
import { useTranslation } from "react-i18next";

// Define OrderStatus type
type OrderStatus = "pending" | "processing" | "fulfilled" | "cancelled";

// Define Order type
interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  stallId: string;
  personnelId: string;
  orderedBy?: string;
  printingInstituteName?: string;
  contactPersonName?: string;
  contactPersonMobile?: string;
}

// Define OrderItem type
interface OrderItem {
  id: string;
  bookId: string;
  quantity: number;
  price: number;
  orderId: string;
}

const OrderManagementPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [printingInstituteName, setPrintingInstituteName] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonMobile, setContactPersonMobile] = useState("");
  const [orderItems, setOrderItems] = useState<{bookId: string, quantity: number}[]>([
    { bookId: "", quantity: 1 }
  ]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  useEffect(() => {
    if (!currentUser || !currentUser.canRestock) {  // Fixed: canRestock instead of canrestock
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);

      if (!currentStore) {
        setBooks([]);
        setOrders([]);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch books
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("*")
          .eq("stallid", currentStore)
          .order('name', { ascending: true });

        if (booksError) {
          console.error("Error fetching books:", booksError);
          toast({
            title: "Error",
            description: "Failed to load books",
            variant: "destructive",
          });
          return;
        }

        // Transform to Book type
        const formattedBooks: Book[] = booksData.map(book => ({
          id: book.id,
          barcode: book.barcode || undefined,
          name: book.name,
          author: book.author,
          category: book.category || "",
          printingInstitute: book.printinginstitute || "",
          originalPrice: book.originalprice,
          salePrice: book.saleprice,
          quantity: book.quantity,
          stallId: book.stallid,
          imageUrl: book.imageurl,
          createdAt: book.createdat ? new Date(book.createdat) : new Date(),
          updatedAt: book.updatedat ? new Date(book.updatedat) : new Date()
        }));

        setBooks(formattedBooks);

        // Fetch orders - for now using a placeholder as we need to create the orders table
        // This will be replaced with actual data once we have the orders table
        setOrders([]);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentStore, currentUser, navigate, toast, t]);

  const handleAddItemField = () => {
    setOrderItems([...orderItems, { bookId: "", quantity: 1 }]);
  };

  const handleRemoveItemField = (index: number) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof typeof orderItems[0], value: any) => {
    const newItems = [...orderItems];
    if (field === "bookId") {
      newItems[index][field] = value as string;
    } else if (field === "quantity") {
      newItems[index][field] = Number(value);
    }
    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const book = books.find(b => b.id === item.bookId);
      return total + (book ? book.salePrice * item.quantity : 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentStore || !currentUser) {
      toast({
        title: "Error",
        description: "Missing store or user information",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!customerName) {
      toast({
        title: "Missing Information",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    if (orderItems.length === 0 || !orderItems.every(item => item.bookId && item.quantity > 0)) {
      toast({
        title: "Invalid Order Items",
        description: "Please select books and quantities for all items",
        variant: "destructive",
      });
      return;
    }

    // Check if books are in stock
    for (const item of orderItems) {
      const book = books.find(b => b.id === item.bookId);
      if (!book || book.quantity < item.quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Not enough copies of "${book?.name || 'Unknown book'}" available`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderId = generateId();
      const totalAmount = calculateTotal();
      const now = new Date().toISOString();

      // In a production environment, we would insert into an orders table
      // For now, we'll just update the book quantities and create sales records

      // Update book quantities
      for (const item of orderItems) {
        const book = books.find(b => b.id === item.bookId);
        if (book) {
          const newQuantity = book.quantity - item.quantity;
          
          const { error: updateError } = await supabase
            .from('books')
            .update({ 
              quantity: newQuantity, 
              updatedat: now 
            })
            .eq('id', book.id);
            
          if (updateError) {
            console.error(`Error updating quantity for book ${book.id}:`, updateError);
            throw new Error("Failed to update inventory");
          }

          // Create a sale record for this item
          const { error: saleError } = await supabase
            .from('sales')
            .insert({
              id: generateId(),
              bookid: book.id,
              quantity: item.quantity,
              totalamount: book.salePrice * item.quantity,
              paymentmethod: "order",
              buyername: customerName,
              buyerphone: customerPhone || null,
              personnelid: currentUser.id,
              personnelname: currentUser.name, // Include seller name
              stallid: currentStore,
              synced: true
            });
            
          if (saleError) {
            console.error(`Error creating sale for book ${book.id}:`, saleError);
            throw new Error("Failed to record sale");
          }
        }
      }

      toast({
        title: "Success",
        description: "Order processed successfully",
      });

      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setPrintingInstituteName("");
      setContactPersonName("");
      setContactPersonMobile("");
      setOrderItems([{ bookId: "", quantity: 1 }]);
      setNotes("");

      // Refresh book data
      const { data: refreshedBooks, error: refreshError } = await supabase
        .from("books")
        .select("*")
        .eq("stallid", currentStore)
        .order('name', { ascending: true });

      if (!refreshError && refreshedBooks) {
        const formattedBooks: Book[] = refreshedBooks.map(book => ({
          id: book.id,
          barcode: book.barcode || undefined,
          name: book.name,
          author: book.author,
          category: book.category || "",
          printingInstitute: book.printinginstitute || "",
          originalPrice: book.originalprice,
          salePrice: book.saleprice,
          quantity: book.quantity,
          stallId: book.stallid,
          imageUrl: book.imageurl,
          createdAt: book.createdat ? new Date(book.createdat) : new Date(),
          updatedAt: book.updatedat ? new Date(book.updatedat) : new Date()
        }));
        
        setBooks(formattedBooks);
      }
    } catch (error) {
      console.error("Order submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-temple-maroon mb-6">Order Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Order Form */}
          <Card className="temple-card">
            <CardHeader>
              <CardTitle className="text-lg text-temple-maroon">New Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Order By - Logged in user */}
                <div className="space-y-1">
                  <Label>Order By</Label>
                  <p className="text-sm border p-2 rounded-md bg-muted/30">{currentUser?.name}</p>
                </div>

                {/* Printing Institute Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="printingInstituteName">Printing Institute Name</Label>
                    <Input 
                      id="printingInstituteName"
                      value={printingInstituteName}
                      onChange={(e) => setPrintingInstituteName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input 
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                {/* Contact Person Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonName">Contact Person Name</Label>
                    <Input 
                      id="contactPersonName"
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonMobile">Contact Person Mobile</Label>
                    <Input 
                      id="contactPersonMobile"
                      value={contactPersonMobile}
                      onChange={(e) => setContactPersonMobile(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Customer Phone</Label>
                    <Input 
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Customer Email</Label>
                    <Input 
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Order Items *</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddItemField}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add Item
                    </Button>
                  </div>
                  
                  {orderItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                      <div className="md:col-span-7">
                        <Label htmlFor={`book-${index}`} className="sr-only">Book</Label>
                        <Select
                          value={item.bookId}
                          onValueChange={(value) => handleItemChange(index, "bookId", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select book" />
                          </SelectTrigger>
                          <SelectContent>
                            {books
                              .filter(book => book.quantity > 0)
                              .map((book) => (
                                <SelectItem key={book.id} value={book.id}>
                                  {book.name} ({book.quantity} available)
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="md:col-span-3">
                        <Label htmlFor={`quantity-${index}`} className="sr-only">Quantity</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="md:col-span-2 flex justify-center">
                        {orderItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItemField(index)}
                            className="h-10 p-0 w-10"
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                      
                      {item.bookId && (
                        <div className="md:col-span-12 text-sm text-muted-foreground">
                          {(() => {
                            const book = books.find(b => b.id === item.bookId);
                            if (book) {
                              return `${book.author} - ₹${book.salePrice.toFixed(2)} × ${item.quantity} = ₹${(book.salePrice * item.quantity).toFixed(2)}`;
                            }
                            return null;
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-medium">Total Amount</p>
                    <p className="font-bold text-xl text-temple-maroon">₹{calculateTotal().toFixed(2)}</p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-temple-maroon hover:bg-temple-maroon/90" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Process Order"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Recent Orders */}
          <Card className="temple-card">
            <CardHeader>
              <CardTitle className="text-lg text-temple-maroon">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-temple-maroon" />
                </div>
              ) : orders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>{order.customerName}</TableCell>
                        <TableCell>
                          {order.status === "fulfilled" ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" /> Fulfilled
                            </span>
                          ) : order.status === "cancelled" ? (
                            <span className="flex items-center text-red-600">
                              <AlertTriangle className="h-4 w-4 mr-1" /> Cancelled
                            </span>
                          ) : (
                            <span className="flex items-center text-amber-600">
                              <Loader2 className="h-4 w-4 mr-1" /> {order.status}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">₹{order.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-60 flex items-center justify-center">
                  <p className="text-muted-foreground">No recent orders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default OrderManagementPage;
