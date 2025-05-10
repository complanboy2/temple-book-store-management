
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Book, Sale } from "@/types";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { CalendarDays, ChartBar, Download, FileText, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStallContext } from "@/contexts/StallContext";
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { addDays, format, isAfter, isBefore, parseISO, startOfDay, endOfDay, subDays } from "date-fns";

const ReportsPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'category' | 'author' | 'institute'>('daily');
  const [currentPage, setCurrentPage] = useState(1);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [authorData, setAuthorData] = useState<any[]>([]);
  const [instituteData, setInstituteData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 7)); // Default to last 7 days
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [personnelNames, setPersonnelNames] = useState<Record<string, string>>({});
  const { isAdmin } = useAuth();
  const { currentStore } = useStallContext();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const itemsPerPage = 10;
  const COLORS = ['#9b87f5', '#F97316', '#0EA5E9', '#ea384c', '#8E9196', '#1A1F2C'];

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    
    if (!currentStore) {
      setIsLoading(false);
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch books data from Supabase
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('*')
          .eq('stallid', currentStore);
          
        if (booksError) {
          throw new Error(`Error fetching books: ${booksError.message}`);
        }
        
        // Fetch sales data from Supabase
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('*')
          .eq('stallid', currentStore)
          .order('createdat', { ascending: false });
          
        if (salesError) {
          throw new Error(`Error fetching sales: ${salesError.message}`);
        }
        
        // Fetch personnel data to map IDs to names from users table instead of stall_personnel
        const { data: personnelData, error: personnelError } = await supabase
          .from('users')
          .select('id, name');
          
        if (personnelError) {
          console.error("Error fetching personnel data:", personnelError);
        } else if (personnelData) {
          // Create a mapping of personnel IDs to names
          const nameMap: Record<string, string> = {};
          personnelData.forEach(person => {
            nameMap[person.id] = person.name;
          });
          setPersonnelNames(nameMap);
        }
        
        // Convert to proper format - map database fields to our types
        const formattedBooks = booksData.map(book => ({
          id: book.id,
          barcode: book.barcode,
          name: book.name,
          author: book.author,
          category: book.category,
          printingInstitute: book.printinginstitute,
          originalPrice: book.originalprice,
          salePrice: book.saleprice,
          quantity: book.quantity,
          stallId: book.stallid,
          imageUrl: book.imageurl,
          createdAt: new Date(book.createdat),
          updatedAt: new Date(book.updatedat)
        })) as Book[];
        
        const formattedSales = salesData.map(sale => ({
          id: sale.id,
          bookId: sale.bookid,
          quantity: sale.quantity,
          totalAmount: sale.totalamount,
          paymentMethod: sale.paymentmethod,
          buyerName: sale.buyername || "",
          buyerPhone: sale.buyerphone || "",
          personnelId: sale.personnelid,
          stallId: sale.stallid,
          createdAt: new Date(sale.createdat),
          synced: sale.synced
        })) as Sale[];
        
        setBooks(formattedBooks);
        setSales(formattedSales);
        
        // Apply initial date filters
        applyDateFilter(formattedSales, formattedBooks, startDate, endDate);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadSales"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentStore, isAdmin, navigate, t, toast]);
  
  // Apply date filters and update report data
  const applyDateFilter = (salesData: Sale[], booksData: Book[], start?: Date, end?: Date) => {
    let filtered = [...salesData];
    
    if (start) {
      const startOfDayDate = startOfDay(start);
      filtered = filtered.filter(sale => 
        isAfter(new Date(sale.createdAt), startOfDayDate)
      );
    }
    
    if (end) {
      const endOfDayDate = endOfDay(end);
      filtered = filtered.filter(sale => 
        isBefore(new Date(sale.createdAt), endOfDayDate)
      );
    }
    
    setFilteredSales(filtered);
    prepareReportData(filtered, booksData);
  };
  
  // Effect to update filtered data when date range or sales data changes
  useEffect(() => {
    if (sales.length > 0) {
      applyDateFilter(sales, books, startDate, endDate);
    }
  }, [startDate, endDate, sales.length]);
  
  const prepareReportData = (salesData: Sale[], booksData: Book[]) => {
    // Daily sales data
    const dailyData = prepareDailyData(salesData);
    setSalesData(dailyData);
    
    // Category data
    const catData = prepareCategoryData(salesData, booksData);
    setCategoryData(catData);
    
    // Author data
    const authData = prepareAuthorData(salesData, booksData);
    setAuthorData(authData);
    
    // Institute data
    const instData = prepareInstituteData(salesData, booksData);
    setInstituteData(instData);
  };
  
  const prepareDailyData = (salesData: Sale[]) => {
    // Get date range for the chart
    const daysToShow = 7;
    const dateRange = [...Array(daysToShow)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysToShow - 1 - i));
      return date.toISOString().split('T')[0];
    });
    
    const dailyTotals = dateRange.map(date => {
      const dayTotal = salesData
        .filter(sale => new Date(sale.createdAt).toISOString().split('T')[0] === date)
        .reduce((sum, sale) => sum + sale.totalAmount, 0);
      
      return {
        date: format(parseISO(date), 'MMM dd'),
        sales: dayTotal
      };
    });
    
    return dailyTotals;
  };
  
  const prepareCategoryData = (salesData: Sale[], booksData: Book[]) => {
    const categorySales: Record<string, number> = {};
    
    salesData.forEach(sale => {
      const book = booksData.find(b => b.id === sale.bookId);
      if (book) {
        const category = book.category || t("common.uncategorized");
        categorySales[category] = (categorySales[category] || 0) + sale.quantity;
      }
    });
    
    return Object.entries(categorySales).map(([category, quantity]) => ({
      name: category,
      value: quantity
    }));
  };
  
  const prepareAuthorData = (salesData: Sale[], booksData: Book[]) => {
    const authorSales: Record<string, number> = {};
    
    salesData.forEach(sale => {
      const book = booksData.find(b => b.id === sale.bookId);
      if (book) {
        authorSales[book.author] = (authorSales[book.author] || 0) + sale.quantity;
      }
    });
    
    return Object.entries(authorSales)
      .map(([author, quantity]) => ({
        name: author,
        value: quantity
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 authors
  };
  
  const prepareInstituteData = (salesData: Sale[], booksData: Book[]) => {
    const instituteSales: Record<string, number> = {};
    
    salesData.forEach(sale => {
      const book = booksData.find(b => b.id === sale.bookId);
      if (book) {
        const institute = book.printingInstitute || t("common.notSpecified");
        instituteSales[institute] = (instituteSales[institute] || 0) + sale.quantity;
      }
    });
    
    return Object.entries(instituteSales).map(([institute, quantity]) => ({
      name: institute,
      value: quantity
    }));
  };
  
  // Get displayable data based on current report type
  const getCurrentData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    switch (reportType) {
      case 'daily':
      case 'weekly':
      case 'monthly':
        return filteredSales
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(startIndex, endIndex);
      case 'category':
        return categoryData.slice(startIndex, endIndex);
      case 'author':
        return authorData.slice(startIndex, endIndex);
      case 'institute':
        return instituteData.slice(startIndex, endIndex);
      default:
        return [];
    }
  };
  
  const totalPages = Math.ceil(
    (reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly') 
      ? filteredSales.length / itemsPerPage
      : reportType === 'category'
        ? categoryData.length / itemsPerPage
        : reportType === 'author'
          ? authorData.length / itemsPerPage
          : instituteData.length / itemsPerPage
  );
  
  // Export report as CSV
  const exportReport = () => {
    let csvData = '';
    
    if (reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly') {
      csvData = 'Date,Book,Seller,Quantity,Amount,Payment Method\n';
      filteredSales.forEach(sale => {
        const book = books.find(b => b.id === sale.bookId);
        csvData += `${new Date(sale.createdAt).toLocaleDateString()},${book?.name || 'Unknown'},${personnelNames[sale.personnelId] || sale.personnelId || 'Unknown'},${sale.quantity},${sale.totalAmount},${sale.paymentMethod}\n`;
      });
    } else if (reportType === 'category') {
      csvData = 'Category,Quantity Sold\n';
      categoryData.forEach(item => {
        csvData += `${item.name},${item.value}\n`;
      });
    } else if (reportType === 'author') {
      csvData = 'Author,Quantity Sold\n';
      authorData.forEach(item => {
        csvData += `${item.name},${item.value}\n`;
      });
    } else if (reportType === 'institute') {
      csvData = 'Printing Institute,Quantity Sold\n';
      instituteData.forEach(item => {
        csvData += `${item.name},${item.value}\n`;
      });
    }
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${startDate?.toISOString().split('T')[0]}-to-${endDate?.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Handle date changes
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">
            {t("common.reports")} & {t("common.analytics")}
          </h1>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={reportType === 'daily' ? "default" : "outline"}
              className={reportType === 'daily' ? "bg-temple-saffron" : "border-temple-saffron text-temple-maroon"}
              onClick={() => setReportType('daily')}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {t("common.today")}
            </Button>
            <Button
              variant={reportType === 'category' ? "default" : "outline"}
              className={reportType === 'category' ? "bg-temple-saffron" : "border-temple-saffron text-temple-maroon"}
              onClick={() => setReportType('category')}
            >
              <ChartBar className="mr-2 h-4 w-4" />
              {t("common.byCategory")}
            </Button>
            <Button
              variant={reportType === 'author' ? "default" : "outline"}
              className={reportType === 'author' ? "bg-temple-saffron" : "border-temple-saffron text-temple-maroon"}
              onClick={() => setReportType('author')}
            >
              <FileText className="mr-2 h-4 w-4" />
              {t("common.byAuthor")}
            </Button>
            <Button
              variant={reportType === 'institute' ? "default" : "outline"}
              className={reportType === 'institute' ? "bg-temple-saffron" : "border-temple-saffron text-temple-maroon"}
              onClick={() => setReportType('institute')}
            >
              <FileText className="mr-2 h-4 w-4" />
              {t("common.byInstitute")}
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <Card className="temple-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-temple-maroon">{t("common.dateRangeFilter")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("common.startDate")}</p>
                  <DatePicker
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    placeholder={t("common.selectStartDate")}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("common.endDate")}</p>
                  <DatePicker
                    mode="single"
                    selected={endDate}
                    onSelect={handleEndDateChange}
                    placeholder={t("common.selectEndDate")}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  className="border-temple-maroon text-temple-maroon hover:bg-temple-maroon/10"
                  onClick={() => {
                    setStartDate(subDays(new Date(), 7));
                    setEndDate(new Date());
                  }}
                >
                  {t("common.lastSevenDays")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {isLoading ? (
          <div className="text-center py-10">
            <p>{t("common.loading")}...</p>
          </div>
        ) : (
          <>
            {/* Detailed Sales Table - Now shown first */}
            <Card className="temple-card overflow-hidden bg-white border border-gray-200 shadow-md mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-[#0EA5E9]/20 to-white border-b">
                <CardTitle className="text-lg text-temple-maroon">{t("common.detailedReport")}</CardTitle>
                <Button 
                  onClick={exportReport}
                  variant="outline"
                  className="border-temple-maroon text-temple-maroon hover:bg-temple-maroon/10 flex items-center gap-2"
                  disabled={
                    (reportType === 'daily' && filteredSales.length === 0) ||
                    (reportType === 'category' && categoryData.length === 0) ||
                    (reportType === 'author' && authorData.length === 0) ||
                    (reportType === 'institute' && instituteData.length === 0)
                  }
                >
                  <Download className="h-4 w-4" />
                  {t("common.exportCSV")}
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly' ? (
                        <>
                          <TableHead>{t("common.date")}</TableHead>
                          <TableHead>{t("common.book")}</TableHead>
                          <TableHead>{t("common.seller")}</TableHead>
                          <TableHead>{t("common.quantity")}</TableHead>
                          <TableHead className="text-right">{t("common.amount")}</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>{reportType === 'category' ? t("common.category") : 
                                      reportType === 'author' ? t("common.author") : t("common.publisher")}</TableHead>
                          <TableHead className="text-right">{t("common.quantitySold")}</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly' ? (
                      getCurrentData().map((sale: Sale) => {
                        const book = books.find(b => b.id === sale.bookId);
                        return (
                          <TableRow key={sale.id}>
                            <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>{book?.name || t("common.unknownBook")}</TableCell>
                            <TableCell>{personnelNames[sale.personnelId] || t("common.unknownSeller")}</TableCell>
                            <TableCell>{sale.quantity}</TableCell>
                            <TableCell className="text-right font-semibold">₹{sale.totalAmount}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      getCurrentData().map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right font-semibold">{item.value}</TableCell>
                        </TableRow>
                      ))
                    )}
                    
                    {getCurrentData().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly' ? 5 : 2} className="text-center py-6">
                          {t("common.noDataAvailable")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationPrevious onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} />
                          </PaginationItem>
                        )}
                        
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink 
                                isActive={currentPage === pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        {currentPage < totalPages && (
                          <PaginationItem>
                            <PaginationNext onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Charts Section - Now shown after the detailed report */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Sales Trend Chart */}
              <Card className="temple-card overflow-hidden bg-white border border-gray-200 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#9b87f5]/20 to-white border-b">
                  <CardTitle className="text-lg text-temple-maroon">{t("common.salesTrend")}</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-80">
                    {salesData.length > 0 ? (
                      <ChartContainer config={{}} className="h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="sales" fill="#9b87f5" name={t("common.revenue")} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">{t("common.noSalesData")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Category or Author Distribution */}
              <Card className="temple-card overflow-hidden bg-white border border-gray-200 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#F97316]/20 to-white border-b">
                  <CardTitle className="text-lg text-temple-maroon">
                    {reportType === 'category' ? t("common.salesByCategory") : 
                     reportType === 'author' ? t("common.topAuthors") : 
                     reportType === 'institute' ? t("common.printingInstitutes") : t("common.salesDistribution")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-80">
                    {(reportType === 'category' ? categoryData.length > 0 : 
                     reportType === 'author' ? authorData.length > 0 : 
                     reportType === 'institute' ? instituteData.length > 0 : false) ? (
                      <ChartContainer config={{}} className="h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportType === 'category' ? categoryData : 
                                  reportType === 'author' ? authorData : 
                                  reportType === 'institute' ? instituteData : []}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="name"
                              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {(reportType === 'category' ? categoryData : 
                                reportType === 'author' ? authorData : 
                                reportType === 'institute' ? instituteData : []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">{t("common.noDataAvailable")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ReportsPage;
