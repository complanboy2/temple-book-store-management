
import React, { useEffect, useState } from "react";
import { getSales, getBooks } from "@/services/storageService";
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
import { CalendarDays, ChartBar, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ReportsPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'category' | 'author' | 'institute'>('daily');
  const [currentPage, setCurrentPage] = useState(1);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [authorData, setAuthorData] = useState<any[]>([]);
  const [instituteData, setInstituteData] = useState<any[]>([]);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const itemsPerPage = 10;
  const COLORS = ['#FFC107', '#800000', '#FF6F00', '#FF9800', '#4CAF50', '#2196F3'];

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    
    const fetchData = () => {
      const allBooks = getBooks();
      const allSales = getSales();
      setBooks(allBooks);
      setSales(allSales);
      
      prepareReportData(allSales, allBooks);
    };
    
    fetchData();
    
    // Refresh data every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [isAdmin, navigate]);
  
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
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    const dailyTotals = last7Days.map(date => {
      const dayTotal = salesData
        .filter(sale => new Date(sale.createdAt).toISOString().split('T')[0] === date)
        .reduce((sum, sale) => sum + sale.totalAmount, 0);
      
      return {
        date: date,
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
        categorySales[book.category] = (categorySales[book.category] || 0) + sale.quantity;
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
        instituteSales[book.printingInstitute] = (instituteSales[book.printingInstitute] || 0) + sale.quantity;
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
        return sales
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
      ? sales.length / itemsPerPage
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
      csvData = 'Date,Book,Quantity,Amount\n';
      sales.forEach(sale => {
        const book = books.find(b => b.id === sale.bookId);
        csvData += `${new Date(sale.createdAt).toLocaleDateString()},${book?.name || 'Unknown'},${sale.quantity},${sale.totalAmount}\n`;
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
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="min-h-screen bg-temple-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">Reports & Analytics</h1>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={reportType === 'daily' ? "default" : "outline"}
              className={reportType === 'daily' ? "bg-temple-saffron" : "border-temple-saffron text-temple-maroon"}
              onClick={() => setReportType('daily')}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Daily
            </Button>
            <Button
              variant={reportType === 'category' ? "default" : "outline"}
              className={reportType === 'category' ? "bg-temple-saffron" : "border-temple-saffron text-temple-maroon"}
              onClick={() => setReportType('category')}
            >
              <ChartBar className="mr-2 h-4 w-4" />
              By Category
            </Button>
            <Button
              variant={reportType === 'author' ? "default" : "outline"}
              className={reportType === 'author' ? "bg-temple-saffron" : "border-temple-saffron text-temple-maroon"}
              onClick={() => setReportType('author')}
            >
              <FileText className="mr-2 h-4 w-4" />
              By Author
            </Button>
            <Button
              variant={reportType === 'institute' ? "default" : "outline"}
              className={reportType === 'institute' ? "bg-temple-saffron" : "border-temple-saffron text-temple-maroon"}
              onClick={() => setReportType('institute')}
            >
              <FileText className="mr-2 h-4 w-4" />
              By Institute
            </Button>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Trend Chart */}
          <Card className="temple-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg text-temple-maroon">Sales Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ChartContainer config={{}} className="h-full">
                  <BarChart data={salesData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#FFC107" name="Revenue" />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Category or Author Distribution */}
          <Card className="temple-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg text-temple-maroon">
                {reportType === 'category' ? 'Sales by Category' : 
                 reportType === 'author' ? 'Top Authors' : 
                 reportType === 'institute' ? 'Printing Institutes' : 'Sales Distribution'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ChartContainer config={{}} className="h-full">
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
                  </PieChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Sales Table */}
        <Card className="temple-card overflow-hidden mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-temple-maroon">Detailed Report</CardTitle>
            <Button 
              onClick={exportReport}
              variant="outline"
              className="border-temple-maroon text-temple-maroon hover:bg-temple-maroon/10"
            >
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly' ? (
                    <>
                      <TableHead>Date</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>{reportType === 'category' ? 'Category' : 
                                  reportType === 'author' ? 'Author' : 'Printing Institute'}</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
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
                        <TableCell>{book?.name || "Unknown Book"}</TableCell>
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
                    <TableCell colSpan={reportType === 'daily' || reportType === 'weekly' || reportType === 'monthly' ? 4 : 2} className="text-center py-6">
                      No data available for this report
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
      </main>
    </div>
  );
};

export default ReportsPage;
