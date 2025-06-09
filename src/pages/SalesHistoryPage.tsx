
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/MobileHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Sale {
  id: string;
  bookid: string;
  quantity: number;
  totalamount: number;
  paymentmethod: string;
  buyername?: string;
  buyerphone?: string;
  createdat: string;
  book_name?: string;
  book_author?: string;
  personnelid: string;
  seller_name?: string;
}

const SalesHistoryPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editBuyerName, setEditBuyerName] = useState("");
  const [editBuyerPhone, setEditBuyerPhone] = useState("");
  
  const { currentUser, isAdmin } = useAuth();
  const { currentStore } = useStallContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-close toast function
  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      variant,
      duration: 5000, // Auto-close after 5 seconds
    });
  };

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setToDate(today.toISOString().split('T')[0]);
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const fetchSales = async () => {
    if (!currentUser?.email || !currentStore) {
      console.log("Missing user email or store:", { email: currentUser?.email, store: currentStore });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Fetching sales for user email:", currentUser.email, "in store:", currentStore, "isAdmin:", isAdmin);
      
      // Query sales with proper joins - Admin sees all, personnel sees only their own
      let query = supabase
        .from('sales')
        .select(`
          *,
          books (
            name,
            author
          )
        `)
        .eq('stallid', currentStore)
        .order('createdat', { ascending: false });

      // If not admin, filter by current user's email
      if (!isAdmin) {
        query = query.eq('personnelid', currentUser.email);
      }

      // Add date filters if provided
      if (fromDate) {
        query = query.gte('createdat', fromDate + 'T00:00:00');
      }
      if (toDate) {
        query = query.lte('createdat', toDate + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching sales:", error);
        showToast(t("common.error"), "Failed to fetch sales history", "destructive");
        return;
      }

      console.log("Raw sales data:", data);

      // Get seller names for all sales
      const personnelIds = [...new Set(data?.map(sale => sale.personnelid) || [])];
      const personnelNamesMap: Record<string, string> = {};
      
      if (personnelIds.length > 0) {
        try {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, name, email')
            .in('email', personnelIds);
            
          if (!usersError && usersData) {
            usersData.forEach(user => {
              personnelNamesMap[user.email] = user.name;
            });
          }
        } catch (error) {
          console.error("Error fetching user names:", error);
        }
      }

      const salesWithBookInfo = data?.map(sale => ({
        ...sale,
        book_name: sale.books?.name || 'Unknown Book',
        book_author: sale.books?.author || 'Unknown Author',
        seller_name: personnelNamesMap[sale.personnelid] || sale.personnelid || 'Unknown User'
      })) || [];

      console.log("Processed sales data:", salesWithBookInfo);
      setSales(salesWithBookInfo);
    } catch (error) {
      console.error("Error fetching sales:", error);
      showToast(t("common.error"), "Failed to fetch sales history", "destructive");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate && currentUser?.email && currentStore) {
      fetchSales();
    }
  }, [currentUser, currentStore, fromDate, toDate, isAdmin]);

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setEditQuantity(sale.quantity);
    setEditPaymentMethod(sale.paymentmethod);
    setEditBuyerName(sale.buyername || "");
    setEditBuyerPhone(sale.buyerphone || "");
  };

  const handleUpdateSale = async () => {
    if (!editingSale) return;

    try {
      const { error } = await supabase
        .from('sales')
        .update({
          quantity: editQuantity,
          totalamount: editQuantity * (editingSale.totalamount / editingSale.quantity),
          paymentmethod: editPaymentMethod,
          buyername: editBuyerName || null,
          buyerphone: editBuyerPhone || null,
        })
        .eq('id', editingSale.id);

      if (error) {
        console.error("Error updating sale:", error);
        showToast(t("common.error"), "Failed to update sale", "destructive");
        return;
      }

      showToast(t("common.success"), "Sale updated successfully");
      setEditingSale(null);
      fetchSales();
    } catch (error) {
      console.error("Error updating sale:", error);
      showToast(t("common.error"), "Failed to update sale", "destructive");
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Are you sure you want to delete this sale? The book stock will be automatically restored.")) return;

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (error) {
        console.error("Error deleting sale:", error);
        showToast(t("common.error"), "Failed to delete sale", "destructive");
        return;
      }

      showToast(t("common.success"), "Sale deleted successfully and stock restored");
      fetchSales();
    } catch (error) {
      console.error("Error deleting sale:", error);
      showToast(t("common.error"), "Failed to delete sale", "destructive");
    }
  };

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader 
        title={isAdmin ? "All Sales History" : "My Sales History"}
        showBackButton={true}
        backTo="/"
      />
      
      <div className="mobile-container py-4 space-y-4">
        {/* Date Filter */}
        <Card className="temple-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-temple-maroon flex items-center gap-2">
              <Calendar className="h-5 w-5 text-temple-gold" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={fetchSales} 
              className="w-full bg-temple-maroon hover:bg-temple-maroon/90"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Filter Sales"}
            </Button>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card className="temple-card">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">
              User: {currentUser?.email} | Store: {currentStore} | Sales Count: {sales.length} | Role: {isAdmin ? 'Admin' : 'Personnel'}
            </p>
          </CardContent>
        </Card>

        {/* Sales List */}
        <div className="space-y-3">
          {sales.length > 0 ? (
            sales.map((sale) => (
              <Card key={sale.id} className="temple-card">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-temple-maroon">
                        {sale.book_name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">
                        by {sale.book_author}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(sale.createdat).toLocaleDateString()} • Seller: {sale.seller_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-temple-maroon">
                        ₹{sale.totalamount}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        Qty: {sale.quantity}
                      </Badge>
                    </div>
                  </div>
                  
                  {sale.buyername && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600">
                        Buyer: {sale.buyername}
                        {sale.buyerphone && ` • ${sale.buyerphone}`}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {sale.paymentmethod}
                    </Badge>
                    <div className="flex gap-2">
                      {/* Show edit/delete buttons if admin or if it's user's own sale */}
                      {(isAdmin || sale.personnelid === currentUser?.email) && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditSale(sale)}
                                className="px-2 h-8"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Sale</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="editQuantity">Quantity</Label>
                                  <Input
                                    id="editQuantity"
                                    type="number"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                    min="1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editPaymentMethod">Payment Method</Label>
                                  <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="cash">Cash</SelectItem>
                                      <SelectItem value="card">Card</SelectItem>
                                      <SelectItem value="upi">UPI</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="editBuyerName">Buyer Name (Optional)</Label>
                                  <Input
                                    id="editBuyerName"
                                    value={editBuyerName}
                                    onChange={(e) => setEditBuyerName(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editBuyerPhone">Buyer Phone (Optional)</Label>
                                  <Input
                                    id="editBuyerPhone"
                                    value={editBuyerPhone}
                                    onChange={(e) => setEditBuyerPhone(e.target.value)}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={handleUpdateSale} className="flex-1">
                                    Update Sale
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setEditingSale(null)}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSale(sale.id)}
                            className="px-2 text-destructive hover:text-destructive h-8"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="temple-card">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  {isAdmin ? "No sales found for the selected date range" : "No sales found for the selected date range"}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {isAdmin ? "All sales from all users will appear here" : "Your sales will appear here after you complete transactions"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesHistoryPage;
