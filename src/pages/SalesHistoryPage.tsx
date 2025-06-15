import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStallContext } from "@/contexts/StallContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Search, BarChart3, Users, CreditCard, Edit, Download } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import BookImage from "@/components/BookImage";
import ExportSalesButton from "@/components/ExportSalesButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SaleData {
  id: string;
  bookid: string;
  quantity: number;
  totalamount: number;
  paymentmethod: string;
  buyername?: string;
  personnelid: string;
  createdat: string;
  stallid: string;
  synced: boolean;
  buyerphone?: string;
  book_name?: string;
  book_author?: string;
  book_imageurl?: string;
  personnel_name?: string;
}

const SalesHistoryPage = () => {
  const [sales, setSales] = useState<SaleData[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeller, setSelectedSeller] = useState("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [sellers, setSellers] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { currentStore } = useStallContext();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    if (currentStore) {
      fetchSalesHistory();
    }
  }, [currentStore]);

  useEffect(() => {
    applyFilters();
  }, [sales, searchTerm, selectedSeller, selectedPaymentMethod]);

  const fetchSalesHistory = async () => {
    if (!currentStore) return;

    try {
      setIsLoading(true);
      
      // Fetch sales with book details
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          books (
            name,
            author,
            imageurl
          )
        `)
        .eq('stallid', currentStore)
        .order('createdat', { ascending: false });

      if (salesError) throw salesError;

      // Create a simple personnel name map based on email patterns or IDs
      const personnelMap: Record<string, string> = {};
      
      // Extract unique personnel IDs and try to create readable names
      const personnelIds = [...new Set(salesData?.map(sale => sale.personnelid).filter(Boolean))];
      
      personnelIds.forEach(id => {
        if (typeof id === 'string') {
          if (id.includes('@')) {
            // If it's an email, extract name part
            const namePart = id.split('@')[0];
            personnelMap[id] = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          } else if (id.includes('admin')) {
            personnelMap[id] = 'Admin';
          } else {
            // For other IDs, create a shortened version
            personnelMap[id] = `User-${id.substring(0, 8)}`;
          }
        }
      });

      // Combine sales with personnel and book information
      const salesWithDetails = salesData?.map(sale => ({
        ...sale,
        personnel_name: personnelMap[sale.personnelid] || 'Unknown User',
        book_name: sale.books?.name || 'Unknown Book',
        book_author: sale.books?.author || 'Unknown Author',
        book_imageurl: sale.books?.imageurl || ''
      })) || [];

      setSales(salesWithDetails);
      
      // Extract unique sellers and payment methods
      const uniqueSellers = [...new Set(salesWithDetails.map(sale => sale.personnel_name).filter(name => name && name !== 'Unknown User'))];
      const uniquePaymentMethods = [...new Set(salesWithDetails.map(sale => sale.paymentmethod).filter(Boolean))];
      
      setSellers(uniqueSellers);
      setPaymentMethods(uniquePaymentMethods);
      
    } catch (error) {
      console.error("Error fetching sales history:", error);
      toast({
        title: t("common.error"),
        description: t("sales.failedToLoadHistory"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = sales;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.book_name?.toLowerCase().includes(searchLower) ||
        sale.book_author?.toLowerCase().includes(searchLower) ||
        sale.buyername?.toLowerCase().includes(searchLower) ||
        sale.personnel_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply seller filter - fix the "all" filter issue
    if (selectedSeller && selectedSeller !== "all") {
      filtered = filtered.filter(sale => sale.personnel_name === selectedSeller);
    }

    // Apply payment method filter - fix the "all" filter issue
    if (selectedPaymentMethod && selectedPaymentMethod !== "all") {
      filtered = filtered.filter(sale => sale.paymentmethod === selectedPaymentMethod);
    }

    setFilteredSales(filtered);
  };

  const handleSellerChange = (value: string) => {
    setSelectedSeller(value);
  };

  const handlePaymentMethodChange = (value: string) => {
    setSelectedPaymentMethod(value);
  };

  const handleEditSale = (sale: SaleData) => {
    // Only allow navigation if user is admin or the owner of the sale
    if (isAdmin || sale.personnelid === currentUser?.email) {
      navigate(`/sales/edit/${sale.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("sales.salesHistory")}
        showBackButton={true}
        backTo="/"
        rightContent={
          <ExportSalesButton 
            sales={filteredSales.map(sale => ({
              id: sale.id,
              bookId: sale.bookid,
              quantity: sale.quantity,
              totalAmount: sale.totalamount,
              paymentMethod: sale.paymentmethod,
              buyerName: sale.buyername,
              buyerPhone: sale.buyerphone,
              personnelId: sale.personnelid,
              personnelName: sale.personnel_name,
              stallId: sale.stallid,
              createdAt: new Date(sale.createdat),
              synced: sale.synced
            }))}
          />
        }
      />
      
      <main className="container mx-auto px-3 py-4">
        {/* Search and Filter Section */}
        <Card className="mb-4">
          <CardContent className="p-4 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("sales.searchSales")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Seller Filter */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <Select value={selectedSeller} onValueChange={handleSellerChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t("sales.selectSeller")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("sales.allSellers")}</SelectItem>
                    {sellers.map((seller) => (
                      <SelectItem key={seller} value={seller}>
                        {seller}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Filter */}
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <Select value={selectedPaymentMethod} onValueChange={handlePaymentMethodChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t("sales.selectPaymentMethod")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("sales.allPaymentMethods")}</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          <p>{t("sales.showingResults", { count: filteredSales.length, total: sales.length })}</p>
        </div>

        {/* Sales List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-maroon mx-auto"></div>
            <p className="mt-2 text-muted-foreground">{t("common.loading")}</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("sales.noSalesFound")}
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedSeller !== "all" || selectedPaymentMethod !== "all"
                  ? t("sales.tryDifferentFilters")
                  : t("sales.noSalesRecorded")
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredSales.map((sale) => {
              // Determine whether "edit" should show
              const canEdit = isAdmin || sale.personnelid === currentUser?.email;
              return (
                <Card key={sale.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Book Thumbnail */}
                      <div className="w-16 h-22 flex-shrink-0">
                        <BookImage 
                          imageUrl={sale.book_imageurl} 
                          alt={sale.book_name}
                          size="small"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Sale Details */}
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 leading-tight mb-1">
                                  {sale.book_name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">
                                  {t("common.by")} {sale.book_author}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                                  <span>
                                    <Users className="inline h-3 w-3 mr-1" />
                                    {sale.personnel_name}
                                  </span>
                                  <span>
                                    <CreditCard className="inline h-3 w-3 mr-1" />
                                    {sale.paymentmethod?.charAt(0).toUpperCase() + sale.paymentmethod?.slice(1)}
                                  </span>
                                </div>
                                {sale.buyername && (
                                  <p className="text-xs text-gray-500">
                                    {t("common.customer")}: {sale.buyername}
                                  </p>
                                )}
                              </div>
                              {/* Edit Button logic */}
                              {canEdit && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditSale(sale)}
                                  className="ml-2"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {/* Amount and Date */}
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-temple-maroon">
                              ₹{sale.totalamount}
                            </div>
                            <div className="text-xs text-gray-500">
                              {sale.quantity} × ₹{(sale.totalamount / sale.quantity).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(sale.createdat).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SalesHistoryPage;
