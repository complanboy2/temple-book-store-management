
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrderStatus, PaymentStatus, Book, Order } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useStallContext } from "@/contexts/StallContext";
import MobileHeader from "@/components/MobileHeader";
import { supabase } from "@/integrations/supabase/client";
import {
  getBooks,
  getOrders,
  addOrder,
  generateId,
  updateOrder,
  fulfillOrder,
  updateBookQuantity
} from "@/services/storageService";
import { useTranslation } from "react-i18next";
import { 
  Calendar, 
  CalendarPlus,
  FileText,
  Check,
  X,
  Plus,
  Trash,
  Search
} from "lucide-react";

const OrderManagementPage = () => {
  const { currentStore } = useStallContext();
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    status: "pending",
    paymentStatus: "pending",
    items: [],
    totalAmount: 0,
    notes: ""
  });
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [fulfillmentItems, setFulfillmentItems] = useState<Record<string, number>>({});

  useEffect(() => {
    if (currentStore) {
      loadBooks();
      loadOrders();
    }
  }, [currentStore]);

  useEffect(() => {
    applyFilters();
  }, [orders, activeFilter, searchQuery]);

  const loadBooks = async () => {
    try {
      const storeBooks = getBooks().filter(book => book.stallId === currentStore);
      setBooks(storeBooks);
    } catch (err) {
      console.error("Error loading books:", err);
      toast({
        title: "Error",
        description: "Failed to load books",
        variant: "destructive",
      });
    }
  };

  const loadOrders = async () => {
    try {
      const allOrders = getOrders().filter(order => order.stallId === currentStore);
      setOrders(allOrders);
      setFilteredOrders(allOrders);
    } catch (err) {
      console.error("Error loading orders:", err);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    }
  };

  const applyFilters = () => {
    let result = [...orders];

    // Apply status filter
    if (activeFilter) {
      result = result.filter(order => order.status === activeFilter);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order =>
        order.customerName.toLowerCase().includes(query) ||
        (order.customerPhone && order.customerPhone.includes(query)) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(query))
      );
    }

    // Sort by date, newest first
    result.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    
    setFilteredOrders(result);
  };

  const handleAddItem = () => {
    if (!selectedBookId || selectedQuantity <= 0) return;

    const book = books.find(b => b.id === selectedBookId);
    if (!book) return;

    // Check if we already have this book in the order
    const existingItemIndex = newOrder.items?.findIndex(item => item.bookId === selectedBookId);
    
    let updatedItems = [...(newOrder.items || [])];
    let updatedTotalAmount = newOrder.totalAmount || 0;

    if (existingItemIndex !== undefined && existingItemIndex >= 0) {
      // Update existing item
      const existingItem = updatedItems[existingItemIndex];
      const newQuantity = existingItem.quantity + selectedQuantity;
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
      };
      updatedTotalAmount += selectedQuantity * book.salePrice;
    } else {
      // Add new item
      updatedItems.push({
        id: generateId(),
        bookId: book.id,
        quantity: selectedQuantity,
        priceAtOrder: book.salePrice,
        fulfilled: 0
      });
      updatedTotalAmount += selectedQuantity * book.salePrice;
    }

    setNewOrder({
      ...newOrder,
      items: updatedItems,
      totalAmount: updatedTotalAmount
    });

    // Reset selection
    setSelectedBookId("");
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    const item = newOrder.items?.find(item => item.id === itemId);
    if (!item) return;

    const book = books.find(b => b.id === item.bookId);
    if (!book) return;

    const updatedItems = newOrder.items?.filter(i => i.id !== itemId) || [];
    const updatedTotalAmount = (newOrder.totalAmount || 0) - (item.quantity * (book.salePrice));

    setNewOrder({
      ...newOrder,
      items: updatedItems,
      totalAmount: updatedTotalAmount
    });
  };

  const handleCreateOrder = () => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "No store selected",
        variant: "destructive",
      });
      return;
    }

    if (!newOrder.customerName || !newOrder.items?.length) {
      toast({
        title: "Error",
        description: "Customer name and at least one item are required",
        variant: "destructive",
      });
      return;
    }

    const order: Order = {
      id: generateId(),
      customerName: newOrder.customerName || "",
      customerPhone: newOrder.customerPhone,
      customerEmail: newOrder.customerEmail,
      orderDate: new Date(),
      status: "pending",
      items: newOrder.items || [],
      totalAmount: newOrder.totalAmount || 0,
      paymentStatus: newOrder.paymentStatus as PaymentStatus || "pending",
      paymentMethod: newOrder.paymentMethod,
      notes: newOrder.notes,
      adminId: "current-admin", // Replace with actual admin ID when available
      stallId: currentStore,
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false
    };

    addOrder(order);
    
    toast({
      title: "Success",
      description: "Order created successfully",
    });

    // Reset form and reload orders
    setIsAddingOrder(false);
    setNewOrder({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      status: "pending",
      paymentStatus: "pending",
      items: [],
      totalAmount: 0,
      notes: ""
    });
    loadOrders();
  };

  const handleFulfillOrder = (orderId: string) => {
    if (!fulfillmentItems[orderId]) {
      toast({
        title: "Error",
        description: "Please fill in fulfillment quantities",
        variant: "destructive",
      });
      return;
    }

    const success = fulfillOrder(orderId, fulfillmentItems);
    if (success) {
      toast({
        title: "Success",
        description: "Order fulfillment updated",
      });
      loadOrders();
      loadBooks();
      setFulfillmentItems({});
    } else {
      toast({
        title: "Error",
        description: "Failed to update order fulfillment",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFulfillmentQuantity = (orderId: string, itemId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFulfillmentItems(prev => ({
      ...prev,
      [itemId]: numValue
    }));
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updatedOrder = updateOrder(orderId, { status, updatedAt: new Date() });
    if (updatedOrder) {
      toast({
        title: "Success",
        description: `Order status updated to ${status}`,
      });
      loadOrders();
    }
  };

  const handleUpdatePaymentStatus = (orderId: string, paymentStatus: PaymentStatus) => {
    const updatedOrder = updateOrder(orderId, { paymentStatus, updatedAt: new Date() });
    if (updatedOrder) {
      toast({
        title: "Success",
        description: `Payment status updated to ${paymentStatus}`,
      });
      loadOrders();
    }
  };

  const getBookNameById = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    return book ? book.name : "Unknown Book";
  };

  const renderStatusBadge = (status: OrderStatus) => {
    let color = "";
    switch (status) {
      case "pending":
        color = "bg-yellow-100 text-yellow-800";
        break;
      case "confirmed":
        color = "bg-blue-100 text-blue-800";
        break;
      case "processing":
        color = "bg-purple-100 text-purple-800";
        break;
      case "partially_fulfilled":
        color = "bg-orange-100 text-orange-800";
        break;
      case "fulfilled":
        color = "bg-green-100 text-green-800";
        break;
      case "cancelled":
        color = "bg-red-100 text-red-800";
        break;
      default:
        color = "bg-gray-100 text-gray-800";
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const renderPaymentBadge = (status: PaymentStatus) => {
    let color = "";
    switch (status) {
      case "pending":
        color = "bg-yellow-100 text-yellow-800";
        break;
      case "partially_paid":
        color = "bg-orange-100 text-orange-800";
        break;
      case "paid":
        color = "bg-green-100 text-green-800";
        break;
      case "refunded":
        color = "bg-blue-100 text-blue-800";
        break;
      default:
        color = "bg-gray-100 text-gray-800";
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const calculateFulfillmentPercentage = (order: Order) => {
    const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
    const fulfilledItems = order.items.reduce((acc, item) => acc + (item.fulfilled || 0), 0);
    return totalItems > 0 ? Math.round((fulfilledItems / totalItems) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader
        title="Order Management"
        showBackButton={true}
        backTo="/"
        showSearchButton={false}
        showStallSelector={true}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">Order Management</h1>
          
          {!isAddingOrder && (
            <Button
              onClick={() => setIsAddingOrder(true)}
              className="bg-temple-saffron hover:bg-temple-saffron/90 flex items-center gap-2"
            >
              <CalendarPlus className="h-4 w-4" />
              Create New Order
            </Button>
          )}
        </div>
        
        {isAddingOrder ? (
          <Card>
            <CardHeader>
              <CardTitle>Create New Order</CardTitle>
              <CardDescription>Enter customer and order details below</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input 
                      id="customerName" 
                      value={newOrder.customerName || ''} 
                      onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input 
                      id="customerPhone" 
                      value={newOrder.customerPhone || ''} 
                      onChange={(e) => setNewOrder({...newOrder, customerPhone: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input 
                    id="customerEmail" 
                    type="email"
                    value={newOrder.customerEmail || ''} 
                    onChange={(e) => setNewOrder({...newOrder, customerEmail: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select 
                      value={newOrder.paymentStatus || 'pending'} 
                      onValueChange={(value) => setNewOrder({...newOrder, paymentStatus: value as PaymentStatus})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select 
                      value={newOrder.paymentMethod || ''} 
                      onValueChange={(value) => setNewOrder({...newOrder, paymentMethod: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input 
                    id="notes" 
                    value={newOrder.notes || ''} 
                    onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                  />
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-lg mb-2">Order Items</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="bookSelect">Select Book</Label>
                      <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a book" />
                        </SelectTrigger>
                        <SelectContent>
                          {books.map(book => (
                            <SelectItem key={book.id} value={book.id}>
                              {book.name} (₹{book.salePrice})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input 
                        id="quantity" 
                        type="number" 
                        min="1" 
                        value={selectedQuantity} 
                        onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        onClick={handleAddItem}
                        className="w-full flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                  
                  {newOrder.items && newOrder.items.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newOrder.items.map((item) => {
                          const book = books.find(b => b.id === item.bookId);
                          return (
                            <TableRow key={item.id}>
                              <TableCell>{book ? book.name : 'Unknown Book'}</TableCell>
                              <TableCell className="text-right">₹{item.priceAtOrder.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">₹{(item.priceAtOrder * item.quantity).toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                          <TableCell className="text-right font-bold">₹{newOrder.totalAmount?.toFixed(2)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No items added yet</p>
                  )}
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingOrder(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateOrder}
                    className="bg-temple-saffron hover:bg-temple-saffron/90"
                  >
                    Create Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-1/3 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={activeFilter}
                onValueChange={setActiveFilter}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All orders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="partially_fulfilled">Partially Fulfilled</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 py-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Order #{order.id.substring(0, 8)}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {new Date(order.orderDate).toLocaleDateString()} • {order.customerName}
                            {order.customerPhone && ` • ${order.customerPhone}`}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                          {renderStatusBadge(order.status)}
                          {renderPaymentBadge(order.paymentStatus)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${calculateFulfillmentPercentage(order)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>Fulfillment: {calculateFulfillmentPercentage(order)}%</span>
                          <span>
                            {order.items.reduce((acc, item) => acc + (item.fulfilled || 0), 0)} of {order.items.reduce((acc, item) => acc + item.quantity, 0)} items fulfilled
                          </span>
                        </div>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Fulfilled</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{getBookNameById(item.bookId)}</TableCell>
                              <TableCell className="text-right">₹{item.priceAtOrder.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                {order.status !== "fulfilled" ? (
                                  <div className="flex justify-end">
                                    <Input
                                      type="number"
                                      min="0"
                                      max={item.quantity - (item.fulfilled || 0)}
                                      className="w-16 text-right"
                                      placeholder="0"
                                      onChange={(e) => handleUpdateFulfillmentQuantity(order.id, item.id, e.target.value)}
                                    />
                                  </div>
                                ) : (
                                  item.fulfilled || 0
                                )}
                              </TableCell>
                              <TableCell className="text-right">₹{(item.priceAtOrder * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell colSpan={4} className="text-right font-bold">Total:</TableCell>
                            <TableCell className="text-right font-bold">₹{order.totalAmount.toFixed(2)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      
                      {order.notes && (
                        <div className="mt-4 p-3 bg-muted/30 rounded-md">
                          <p className="text-sm font-medium">Notes:</p>
                          <p className="text-sm">{order.notes}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-between mt-6">
                        <div className="space-x-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) => handleUpdateOrderStatus(order.id, value as OrderStatus)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="partially_fulfilled">Partially Fulfilled</SelectItem>
                              <SelectItem value="fulfilled">Fulfilled</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Select
                            value={order.paymentStatus}
                            onValueChange={(value) => handleUpdatePaymentStatus(order.id, value as PaymentStatus)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Update Payment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="partially_paid">Partially Paid</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {order.status !== "fulfilled" && order.status !== "cancelled" && (
                          <Button
                            onClick={() => handleFulfillOrder(order.id)}
                            className="bg-temple-maroon hover:bg-temple-maroon/90"
                          >
                            Update Fulfillment
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">No orders found</p>
                {activeFilter && (
                  <Button
                    onClick={() => setActiveFilter("")}
                    variant="link"
                    className="mt-2 text-temple-saffron"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default OrderManagementPage;
