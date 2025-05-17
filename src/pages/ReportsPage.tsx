
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

const ReportsPage = () => {
  const [sales, setSales] = useState([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [bookDetailsMap, setBookDetailsMap] = useState({});

  // Add a new state for seller filter
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [sellers, setSellers] = useState<{id: string, name: string}[]>([]);

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
          .select('id, category')
          .eq('stallid', currentStore);

        if (booksError) {
          console.error("Error fetching books:", booksError);
          return;
        }

        const uniqueCategories = new Set<string>();
        const bookMap = {};

        booksData?.forEach(book => {
          if (book.category) {
            uniqueCategories.add(book.category);
          }
          bookMap[book.id] = { category: book.category };
        });

        setCategories(Array.from(uniqueCategories));
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
        // Query the users table instead of personnel
        const { data, error } = await supabase
          .from('users')
          .select('id, name')
          .eq('instituteid', currentStore);
          
        if (error) {
          console.error('Error fetching sellers:', error);
          return;
        }
        
        if (data && data.length > 0) {
          setSellers(data);
        }
      } catch (error) {
        console.error('Unexpected error fetching sellers:', error);
      }
    };
    
    fetchSellers();
  }, [currentStore]);
  
  // Modify filterSales function to include seller filtering
  const filterSales = () => {
    if (!sales.length) return [];
    
    return sales.filter(sale => {
      // Apply date range filter
      if (dateRange.from && dateRange.to) {
        const saleDate = new Date(sale.createdAt);
        const from = new Date(dateRange.from);
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999); // End of day
        
        if (saleDate < from || saleDate > to) return false;
      }
      
      // Apply category filter
      if (selectedCategory && bookDetailsMap[sale.bookId]) {
        const book = bookDetailsMap[sale.bookId];
        if (book.category !== selectedCategory) return false;
      }
      
      // Apply seller filter
      if (selectedSeller && sale.personnelId !== selectedSeller) {
        return false;
      }
      
      return true;
    });
  };

  const salesByCategory = () => {
    const filtered = filterSales();
    const categorySales = {};

    filtered.forEach(sale => {
      const book = bookDetailsMap[sale.bookId];
      const category = book?.category || 'Uncategorized';
      if (!categorySales[category]) {
        categorySales[category] = 0;
      }
      categorySales[category] += sale.totalAmount;
    });

    return Object.keys(categorySales).map(category => ({
      category,
      amount: categorySales[category],
    }));
  };

  const salesTrendData = () => {
    const filtered = filterSales();
    const dailySales = {};

    filtered.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString();
      if (!dailySales[date]) {
        dailySales[date] = 0;
      }
      dailySales[date] += sale.totalAmount;
    });

    return Object.keys(dailySales).map(date => ({
      date,
      amount: dailySales[date],
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          <div className="flex flex-col md:flex-row gap-2">
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="temple-select">
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
              <SelectTrigger className="temple-select">
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
        </div>
        
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("common.salesTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("common.salesByCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByCategory()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
