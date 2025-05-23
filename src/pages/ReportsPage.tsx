import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TrendingUp, ShoppingBag, UserIcon, Banknote } from "lucide-react";

const ReportsPage = () => {
  const [sales, setSales] = useState([]);
  // Set today as default date range
  const today = new Date();
  const [dateRange, setDateRange] = useState({ 
    from: today, 
    to: today
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [bookDetailsMap, setBookDetailsMap] = useState({});

  // Add new state for author and institute filters
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [sellers, setSellers] = useState<{id: string, name: string}[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("");
  const [authors, setAuthors] = useState<string[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<string>("");
  const [institutes, setInstitutes] = useState<string[]>([]);
  
  // Add state for filtered sales data
  const [filteredSales, setFilteredSales] = useState([]);
  
  // Add dashboard summary stats
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

  // Add an effect to fetch unique sellers
  useEffect(() => {
    const fetchSellers = async () => {
      if (!currentStore) return;
      
      try {
        // Query the users table
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
  
  // Generate sales report data for ExportReportButton
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
  
  // Update filterSales to update state with filtered results and dashboard stats
  const filterSales = () => {
    if (!sales.length) return [];
    
    const filtered = sales.filter(sale => {
      // Apply date range filter
      if (dateRange.from && dateRange.to) {
        const saleDate = new Date(sale.createdat);
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0); // Start of day
        
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999); // End of day
        
        if (saleDate < from || saleDate > to) return false;
      }
      
      // Apply category filter
      if (selectedCategory && bookDetailsMap[sale.bookid]) {
        if (bookDetailsMap[sale.bookid].category !== selectedCategory) return false;
      }
      
      // Apply seller filter
      if (selectedSeller && sale.personnelid !== selectedSeller) {
        return false;
      }
      
      // Apply author filter
      if (selectedAuthor && bookDetailsMap[sale.bookid]) {
        if (bookDetailsMap[sale.bookid].author !== selectedAuthor) return false;
      }
      
      // Apply institute filter
      if (selectedInstitute && bookDetailsMap[sale.bookid]) {
        if (bookDetailsMap[sale.bookid].institute !== selectedInstitute) return false;
      }
      
      return true;
    });
    
    // Update filtered sales state
    setFilteredSales(filtered);

    // Calculate dashboard stats
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

  // Effect to update filtered sales whenever filters change
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
        {/* Filter Controls - Improved mobile layout */}
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
          
            <Select 
              value={selectedAuthor} 
              onValueChange={setSelectedAuthor}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectAuthor")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("common.all")}</SelectItem>
                {authors.map(author => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedInstitute} 
              onValueChange={setSelectedInstitute}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectInstitute")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("common.all")}</SelectItem>
                {institutes.map(institute => (
                  <SelectItem key={institute} value={institute}>
                    {institute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Export Report Button */}
          <div className="flex justify-end">
            <ExportReportButton 
              reportType="sales"
              salesData={generateSalesReportData()}
              dateRange={dateRange}
            />
          </div>
        </div>
        
        {/* Dashboard Stats - Improved mobile display */}
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
        
        {/* Sales Trend Chart - Fixed x-axis */}
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

        {/* Sales by Category Chart - Fixed x-axis */}
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
        
        {/* Sales by author chart - Fixed x-axis */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("common.salesByAuthor")}</CardTitle>
          </CardHeader>
          <CardContent className="px-1 sm:px-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByAuthor()} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" name={t("common.revenue")} fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Sales by institute chart - Fixed x-axis */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("common.salesByInstitute")}</CardTitle>
          </CardHeader>
          <CardContent className="px-1 sm:px-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByInstitute()} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" name={t("common.revenue")} fill="#ff8042" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
