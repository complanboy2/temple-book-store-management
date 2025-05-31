import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import MobileHeader from "@/components/MobileHeader";
import ExportReportButton from "@/components/ExportReportButton";
import { format } from "date-fns";
import StatsCard from "@/components/StatsCard";
import { TrendingUp, ShoppingBag, UserIcon, Banknote, BarChart3, Table } from "lucide-react";

const ReportsPage = () => {
  const [sales, setSales] = useState([]);
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');
  const today = new Date();
  const [dateRange, setDateRange] = useState({ 
    from: today, 
    to: today
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [bookDetailsMap, setBookDetailsMap] = useState({});
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [sellers, setSellers] = useState<{id: string, name: string}[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");
  const [authors, setAuthors] = useState<string[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<string>("");
  const [institutes, setInstitutes] = useState<string[]>([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    uniqueBooks: 0,
    uniqueSellers: 0
  });

  const { currentStore } = useStallContext();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSalesAndCategories = async () => {
      if (!currentStore) return;

      try {
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('*')
          .eq('stallid', currentStore);

        if (salesError) {
          console.error("Error fetching sales:", salesError);
          return;
        }

        setSales(salesData || []);

        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('id, category, author, printinginstitute, name, saleprice, imageurl')
          .eq('stallid', currentStore);

        if (booksError) {
          console.error("Error fetching books:", booksError);
          return;
        }

        const uniqueCategories = new Set<string>();
        const uniqueAuthors = new Set<string>();
        const uniqueInstitutes = new Set<string>();
        const bookMap = {};

        booksData?.forEach(book => {
          if (book.category) {
            uniqueCategories.add(book.category);
          }
          if (book.author) {
            uniqueAuthors.add(book.author);
          }
          if (book.printinginstitute) {
            uniqueInstitutes.add(book.printinginstitute);
          }
          bookMap[book.id] = { 
            category: book.category,
            author: book.author,
            institute: book.printinginstitute,
            name: book.name,
            price: book.saleprice,
            imageurl: book.imageurl
          };
        });

        setCategories(Array.from(uniqueCategories));
        setAuthors(Array.from(uniqueAuthors));
        setInstitutes(Array.from(uniqueInstitutes));
        setBookDetailsMap(bookMap);
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    };

    fetchSalesAndCategories();
  }, [currentStore]);

  useEffect(() => {
    const fetchSellers = async () => {
      if (!currentStore) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name')
          .eq('instituteid', currentStore);
          
        if (error) {
          console.error('Error fetching sellers:', error);
          return;
        }
        
        if (data && Array.isArray(data)) {
          setSellers(data);
        }
      } catch (error) {
        console.error('Unexpected error fetching sellers:', error);
      }
    };
    
    fetchSellers();
  }, [currentStore]);
  
  const generateSalesReportData = () => {
    return filteredSales.map(sale => {
      const book = bookDetailsMap[sale.bookid];
      const sellerInfo = sellers.find(s => s.id === sale.personnelId);
      return {
        id: sale.id,
        bookName: book?.name || 'Unknown',
        author: book?.author || 'Unknown',
        price: book?.price || 0,
        quantity: sale.quantity,
        totalAmount: sale.totalAmount,
        date: new Date(sale.createdat),
        sellerName: sellerInfo?.name || 'Unknown',
        paymentMethod: sale.paymentMethod,
        imageurl: book?.imageurl
      };
    });
  };
  
  const filterSales = () => {
    if (!sales.length) return [];
    
    const filtered = sales.filter(sale => {
      if (dateRange.from && dateRange.to) {
        const saleDate = new Date(sale.createdat);
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        
        if (saleDate < from || saleDate > to) return false;
      }
      
      if (selectedCategory && bookDetailsMap[sale.bookid]) {
        if (bookDetailsMap[sale.bookid].category !== selectedCategory) return false;
      }
      
      if (selectedSeller && sale.personnelid !== selectedSeller) {
        return false;
      }
      
      if (selectedAuthor && bookDetailsMap[sale.bookid]) {
        if (bookDetailsMap[sale.bookid].author !== selectedAuthor) return false;
      }
      
      if (selectedInstitute && bookDetailsMap[sale.bookid]) {
        if (bookDetailsMap[sale.bookid].institute !== selectedInstitute) return false;
      }
      
      return true;
    });
    
    setFilteredSales(filtered);

    const uniqueBookIds = new Set(filtered.map(sale => sale.bookid));
    const uniqueSellerIds = new Set(filtered.map(sale => sale.personnelid));
    const totalItems = filtered.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = filtered.reduce((sum, sale) => sum + sale.totalamount, 0);

    setDashboardStats({
      totalSales: totalItems,
      totalAmount: totalRevenue,
      uniqueBooks: uniqueBookIds.size,
      uniqueSellers: uniqueSellerIds.size
    });
    
    return filtered;
  };

  useEffect(() => {
    filterSales();
  }, [sales, dateRange, selectedCategory, selectedSeller, selectedAuthor, selectedInstitute, bookDetailsMap]);

  const salesByCategory = () => {
    const categorySales = {};

    filteredSales.forEach(sale => {
      const book = bookDetailsMap[sale.bookid];
      const category = book?.category || 'Uncategorized';
      if (!categorySales[category]) {
        categorySales[category] = 0;
      }
      categorySales[category] += sale.totalamount;
    });

    return Object.keys(categorySales).map(category => ({
      name: category,
      amount: categorySales[category],
    }));
  };

  const renderTableView = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("common.salesData")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">{t("common.date")}</th>
                  <th className="text-left p-2">{t("common.book")}</th>
                  <th className="text-left p-2">{t("common.quantity")}</th>
                  <th className="text-left p-2">{t("common.amount")}</th>
                  <th className="text-left p-2">{t("common.buyer")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => {
                  const book = bookDetailsMap[sale.bookid];
                  return (
                    <tr key={sale.id} className="border-b">
                      <td className="p-2">{format(new Date(sale.createdat), 'dd/MM/yyyy')}</td>
                      <td className="p-2">{book?.name || t("common.unknownBook")}</td>
                      <td className="p-2">{sale.quantity}</td>
                      <td className="p-2">₹{sale.totalamount}</td>
                      <td className="p-2">{sale.buyername || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredSales.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                {t("common.noSales")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderChartsView = () => {
    return (
      <>
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("common.salesTrend")}</CardTitle>
          </CardHeader>
          <CardContent className="px-1 sm:px-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTrendData()} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" name={t("common.revenue")} fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("common.salesByCategory")}</CardTitle>
          </CardHeader>
          <CardContent className="px-1 sm:px-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByCategory()} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" name={t("common.revenue")} fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  const salesByAuthor = () => {
    const authorSales = {};

    filteredSales.forEach(sale => {
      const book = bookDetailsMap[sale.bookid];
      const author = book?.author || 'Unknown';
      if (!authorSales[author]) {
        authorSales[author] = 0;
      }
      authorSales[author] += sale.totalamount;
    });

    return Object.keys(authorSales).map(author => ({
      name: author,
      revenue: authorSales[author],
    }));
  };

  const salesByInstitute = () => {
    const instituteSales = {};

    filteredSales.forEach(sale => {
      const book = bookDetailsMap[sale.bookid];
      const institute = book?.institute || 'Unknown';
      if (!instituteSales[institute]) {
        instituteSales[institute] = 0;
      }
      instituteSales[institute] += sale.totalamount;
    });

    return Object.keys(instituteSales).map(institute => ({
      name: institute,
      revenue: instituteSales[institute],
    }));
  };

  const salesTrendData = () => {
    const dailySales = {};

    filteredSales.forEach(sale => {
      const date = new Date(sale.createdat).toLocaleDateString();
      if (!dailySales[date]) {
        dailySales[date] = 0;
      }
      dailySales[date] += sale.totalamount;
    });

    return Object.keys(dailySales).map(date => ({
      date: date,
      revenue: dailySales[date],
    }));
  };

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader 
        title={t("common.salesReports")}
        showBackButton={true}
        showStallSelector={true}
      />
      
      <div className="mobile-container py-4">
        {/* Filter Controls */}
        <div className="space-y-3 mb-6">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          <div className="grid grid-cols-1 gap-2">
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("common.all")}</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedSeller} 
              onValueChange={setSelectedSeller}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectSeller")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("common.all")}</SelectItem>
                {sellers.map(seller => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* View Toggle and Export */}
          <div className="flex justify-between items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'charts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('charts')}
                className="flex items-center gap-1"
              >
                <BarChart3 className="h-4 w-4" />
                {t("common.charts")}
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="flex items-center gap-1"
              >
                <Table className="h-4 w-4" />
                {t("common.table")}
              </Button>
            </div>
            <ExportReportButton 
              reportType="sales"
              salesData={generateSalesReportData()}
              dateRange={dateRange}
            />
          </div>
        </div>
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatsCard
            title={t("common.totalItems")}
            value={dashboardStats.totalSales}
            icon={<ShoppingBag className="h-5 w-5" />}
          />
          <StatsCard
            title={t("common.totalRevenue")}
            value={`₹${dashboardStats.totalAmount.toLocaleString()}`}
            icon={<Banknote className="h-5 w-5" />}
          />
          <StatsCard
            title={t("common.uniqueBooks")}
            value={dashboardStats.uniqueBooks}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatsCard
            title={t("common.uniqueSellers")}
            value={dashboardStats.uniqueSellers}
            icon={<UserIcon className="h-5 w-5" />}
          />
        </div>
        
        {/* Content based on view mode */}
        {viewMode === 'charts' ? renderChartsView() : renderTableView()}
      </div>
    </div>
  );
};

export default ReportsPage;
