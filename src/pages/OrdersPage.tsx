import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Order, Book, OrderStatus, PaymentStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { getOrders, getBooks, fulfillOrder, updateOrder, generateId, addOrder } from "@/services/storageService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { CalendarIcon, Plus, Search, ShoppingCart } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const OrdersPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<Record<string, { id: string; name: string; price: number; quantity: number }>>({});
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [fulfillQuantities, setFulfillQuantities] = useState<Record<string, number>>({});
  
  const { currentUser } = useAuth();
  const { currentStore } = useStallContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // Order schema validation
  const orderFormSchema = z.object({
    customerName: z.string().min(1, "Customer name is required"),
    customerPhone: z.string().optional(),
    customerEmail: z.string().email().optional().or(z.literal("")),
    printingInstituteName: z.string().optional(),
    contactPersonName: z.string().optional(),
    contactPersonMobile: z.string().optional(),
    notes: z.string().optional(),
    paymentMethod: z.string().optional(),
    paymentStatus: z.enum(["pending", "partially_paid", "paid", "refunded"]),
  });

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      printingInstituteName: "",
      contactPersonName: "",
      contactPersonMobile: "",
      notes: "",
      paymentMethod: "",
      paymentStatus: "pending",
    },
  });
  
  // Load orders data
  useEffect(() => {
    const loadData = async () => {
      if (!currentStore) {
        console.log("No store selected");
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Load books
        const allBooks = await getBooks();
        const storeBooks = allBooks.filter(book => book.stallId === currentStore);
        setBooks(storeBooks);
        
        // Load orders
        const allOrders = getOrders();
        const storeOrders = allOrders.filter(order => order.stallId === currentStore);
        setOrders(storeOrders);
        setFilteredOrders(storeOrders);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load orders data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [currentStore, toast]);
  
  // Apply filters
  useEffect(() => {
    let filtered = orders;
    
    // Filter by status
    if (activeTab !== "all") {
      filtered = filtered.filter(order => order.status === activeTab);
    }
    
    // Filter by status dropdown
    if (selectedStatus) {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }
    
    // Filter by payment status
    if (selectedPaymentStatus) {
      filtered = filtered.filter(order => order.paymentStatus === selectedPaymentStatus);
    }
    
    // Filter by specific date
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => {
        return (
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.customerPhone && order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.customerEmail && order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
    }
    
    setFilteredOrders(filtered);
  }, [orders, activeTab, selectedStatus, selectedPaymentStatus, selectedDate, searchTerm]);

  // Handle adding book to order
  const handleAddBook = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    setSelectedBooks(prev => {
      // If book is already in the list, just increase quantity
      if (prev[bookId]) {
        return {
          ...prev,
          [bookId]: {
            ...prev[bookId],
            quantity: prev[bookId].quantity + 1
          }
        };
      }
      
      // Otherwise add new book
      return {
        ...prev,
        [bookId]: {
          id: book.id,
          name: book.name,
          price: book.salePrice,
          quantity: 1
        }
      };
    });
  };
  
  // Handle removing book from order
  const handleRemoveBook = (bookId: string) => {
    setSelectedBooks(prev => {
      const newBooks = { ...prev };
      delete newBooks[bookId];
      return newBooks;
    });
  };
  
  // Handle quantity change for a book in the order
  const handleQuantityChange = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveBook(bookId);
      return;
    }
    
    setSelectedBooks(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        quantity
      }
    }));
  };
  
  // Calculate order total
  const calculateOrderTotal = () => {
    return Object.values(selectedBooks).reduce(
      (total, book) => total + book.price * book.quantity, 
      0
    );
  };
  
  // Handle create order submission
  const handleCreateOrder = (data: z.infer<typeof orderFormSchema>) => {
    if (Object.keys(selectedBooks).length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one book to the order",
        variant: "destructive"
      });
      return;
    }
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create an order",
        variant: "destructive"
      });
      return;
    }
    
    if (!currentStore) {
      toast({
        title: "Error",
        description: "No book stall selected",
        variant: "destructive"
      });
      return;
    }
    
    const orderItems = Object.values(selectedBooks).map(book => ({
      id: generateId(),
      bookId: book.id,
      quantity: book.quantity,
      priceAtOrder: book.price,
      fulfilled: 0
    }));
    
    const newOrder: Order = {
      id: generateId(),
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      orderDate: new Date(),
      status: "pending",
      items: orderItems,
      totalAmount: calculateOrderTotal(),
      paymentStatus: data.paymentStatus as PaymentStatus,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      adminId: currentUser.id,
      orderedBy: currentUser.name, // Add orderedBy field
      stallId: currentStore,
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false,
      printingInstituteName: data.printingInstituteName,
      contactPersonName: data.contactPersonName,
      contactPersonMobile: data.contactPersonMobile,
    };
    
    // Save to storage
    addOrder(newOrder);
    
    // Update local state
    setOrders(prev => [newOrder, ...prev]);
    
    // Reset form
    setSelectedBooks({});
    form.reset();
    setCreateDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Order created successfully",
    });
  };
  
  // Add function to add low stock items
  const addLowStockItems = (threshold: number) => {
    const lowStockBooks = books.filter(book => book.quantity <= threshold && book.quantity > 0);
    
    lowStockBooks.forEach(book => {
      if (!selectedBooks[book.id]) {
        handleAddBook(book.id);
      }
    });
    
    if (lowStockBooks.length === 0) {
      toast({
        title: "No Books Found",
        description: `No books with quantity less than or equal to ${threshold} found in inventory.`,
      });
    } else {
      toast({
        title: "Books Added",
        description: `Added ${lowStockBooks.length} low stock books to your order.`,
      });
    }
  };
  
  // Open fulfill order dialog
  const openFulfillDialog = (order: Order) => {
    setSelectedOrder(order);
    
    // Initialize fulfill quantities with remaining unfulfilled quantities
    const quantities: Record<string, number> = {};
    order.items.forEach(item => {
      const remaining = item.quantity - (item.fulfilled || 0);
      if (remaining > 0) {
        quantities[item.id] = remaining;
      }
    });
    
    setFulfillQuantities(quantities);
    setFulfillDialogOpen(true);
  };
  
  // Handle fulfill quantities change
  const handleFulfillQuantityChange = (itemId: string, quantity: number) => {
    if (!selectedOrder) return;
    
    const item = selectedOrder.items.find(i => i.id === itemId);
    if (!item) return;
    
    const maxQuantity = item.quantity - (item.fulfilled || 0);
    const validQuantity = Math.min(Math.max(0, quantity), maxQuantity);
    
    setFulfillQuantities(prev => ({
      ...prev,
      [itemId]: validQuantity
    }));
  };
  
  // Handle order fulfillment
  const handleFulfillOrder = () => {
    if (!selectedOrder) return;
    
    // Check if any quantities are being fulfilled
    const anythingToFulfill = Object.values(fulfillQuantities).some(qty => qty > 0);
    if (!anythingToFulfill) {
      toast({
        title: "Error",
        description: "Please specify quantities to fulfill",
        variant: "destructive"
      });
      return;
    }
    
    // Update order status and fulfill items
    const success = fulfillOrder(selectedOrder.id, fulfillQuantities);
    
    if (success) {
      // Refresh orders
      const updatedOrders = getOrders();
      setOrders(updatedOrders.filter(order => order.stallId === currentStore));
      
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      
      setFulfillDialogOpen(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };
  
  // Calculate summary statistics
  const pendingOrders = filteredOrders.filter(o => o.status === "pending").length;
  const processingOrders = filteredOrders.filter(
    o => o.status === "confirmed" || o.status === "processing" || o.status === "partially_fulfilled"
  ).length;
  const fulfilledOrders = filteredOrders.filter(o => o.status === "fulfilled").length;
  
  // Get unique status options
  const statusOptions: OrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "partially_fulfilled",
    "fulfilled",
    "cancelled"
  ];
  
  const paymentStatusOptions: PaymentStatus[] = [
    "pending",
    "partially_paid",
    "paid",
    "refunded"
  ];

  // Get status badge color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-300";
      case "processing": return "bg-purple-100 text-purple-800 border-purple-300";
      case "partially_fulfilled": return "bg-orange-100 text-orange-800 border-orange-300";
      case "fulfilled": return "bg-green-100 text-green-800 border-green-300";
      case "cancelled": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  
  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "partially_paid": return "bg-blue-100 text-blue-800 border-blue-300";
      case "paid": return "bg-green-100 text-green-800 border-green-300";
      case "refunded": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };
  
  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title="Orders"
        showBackButton={true}
        backTo="/"
        showStallSelector={true}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">Book Orders</h1>
          
          {currentUser?.role === "admin" && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  className="bg-temple-saffron hover:bg-temple-saffron/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] w-[95%] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Order</DialogTitle>
                  <DialogDescription>
                    Add books and order details to create a new order.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateOrder)} className="space-y-4">
                    {/* Order By - Auto populated with logged in user */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Order By</p>
                      <p className="text-sm border p-2 rounded-md bg-muted/30">{currentUser?.name}</p>
                    </div>
                    
                    {/* Printing Institute Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="printingInstituteName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Printing Institute Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter printing institute name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Name*</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter customer name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Contact Person Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactPersonName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter contact person name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactPersonMobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person Mobile</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter contact person mobile" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Customer Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="paymentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Status</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {paymentStatusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value || ""}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Select method</SelectItem>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="card">Card</SelectItem>
                                  <SelectItem value="upi">UPI</SelectItem>
                                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any special instructions or notes"
                              {...field}
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Book selection */}
                    <div className="space-y-2">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
                        <h3 className="text-sm font-medium">Add Books to Order</h3>
                        
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="Qty threshold"
                            className="w-32"
                            min="1"
                            id="threshold-input"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById('threshold-input') as HTMLInputElement;
                              const threshold = parseInt(input?.value || '5');
                              addLowStockItems(threshold);
                            }}
                          >
                            Add Low Stock
                          </Button>
                        </div>
                      </div>
                      
                      <Select onValueChange={handleAddBook}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a book" />
                        </SelectTrigger>
                        <SelectContent>
                          {books.map((book) => (
                            <SelectItem key={book.id} value={book.id}>
                              {book.name} - ₹{book.salePrice} (Qty: {book.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {Object.keys(selectedBooks).length > 0 ? (
                        <div className="border rounded-md mt-2 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Book</TableHead>
                                <TableHead className="whitespace-nowrap">Price</TableHead>
                                <TableHead className="whitespace-nowrap">Qty</TableHead>
                                <TableHead className="whitespace-nowrap">Total</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.values(selectedBooks).map((book) => (
                                <TableRow key={book.id}>
                                  <TableCell className="font-medium">{book.name}</TableCell>
                                  <TableCell>₹{book.price}</TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={book.quantity}
                                      onChange={(e) => handleQuantityChange(
                                        book.id, 
                                        parseInt(e.target.value) || 0
                                      )}
                                      className="w-16"
                                    />
                                  </TableCell>
                                  <TableCell>₹{(book.price * book.quantity).toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveBook(book.id)}
                                    >
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-bold">
                                  Order Total:
                                </TableCell>
                                <TableCell className="font-bold">
                                  ₹{calculateOrderTotal().toFixed(2)}
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center p-4 border rounded-md bg-muted/30">
                          <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No books added to this order yet
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter className="pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={Object.keys(selectedBooks).length === 0}
                      >
                        Create Order
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendingOrders}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Processing Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{processingOrders}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fulfilled Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{fulfilledOrders}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="partially_fulfilled">Partially Fulfilled</TabsTrigger>
            <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={selectedPaymentStatus}
              onValueChange={setSelectedPaymentStatus}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Payment Statuses</SelectItem>
                {paymentStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(searchTerm || selectedDate || selectedStatus || selectedPaymentStatus || activeTab !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDate(undefined);
                  setSelectedStatus("");
                  setSelectedPaymentStatus("");
                  setActiveTab("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Tabs>
        
        {/* Orders table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customerPhone || order.customerEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.items.length} items
                        <p className="text-sm text-muted-foreground">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} total qty
                        </p>
                      </TableCell>
                      <TableCell>
                        ₹{order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} border font-medium`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPaymentStatusColor(order.paymentStatus)} border font-medium`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1).replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {order.status !== "fulfilled" && order.status !== "cancelled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFulfillDialog(order)}
                          >
                            Fulfill
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
      
      {/* Fulfill Order Dialog */}
      <Dialog open={fulfillDialogOpen} onOpenChange={setFulfillDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fulfill Order</DialogTitle>
            <DialogDescription>
              Update quantities to fulfill for this order.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Customer: {selectedOrder.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    Order Date: {new Date(selectedOrder.orderDate).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-[100px] text-right">Ordered</TableHead>
                        <TableHead className="w-[100px] text-right">Fulfilled</TableHead>
                        <TableHead className="w-[120px] text-right">To Fulfill</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => {
                        const book = books.find(b => b.id === item.bookId);
                        const bookName = book ? book.name : "Unknown Book";
                        const maxQuantity = item.quantity - (item.fulfilled || 0);
                        
                        if (maxQuantity <= 0) return null;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{bookName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{item.fulfilled || 0}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min={0}
                                max={maxQuantity}
                                value={fulfillQuantities[item.id] || 0}
                                onChange={(e) => handleFulfillQuantityChange(
                                  item.id, 
                                  parseInt(e.target.value) || 0
                                )}
                                className="w-20 text-right"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setFulfillDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleFulfillOrder}>
                  Update Order
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
