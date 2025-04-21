
import React, { useEffect, useState } from "react";
import { getBooks, getSales } from "@/services/storageService";
import { Book, Sale } from "@/types";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScannerButton from "@/components/ScannerButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";
import { useStallContext } from "@/contexts/StallContext";
import { BookOpen, BarChart2, PlusCircle, Search, TrendingUp } from "lucide-react";

const DashboardPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [topSellingBooks, setTopSellingBooks] = useState<{id: string, name: string, count: number}[]>([]);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { currentStall, stalls } = useStallContext();

  useEffect(() => {
    const fetchData = () => {
      const allBooks = getBooks();
      const allSales = getSales();
      
      let filteredBooks = allBooks;
      let filteredSales = allSales;
      
      // Filter by current stall if available
      if (currentStall) {
        filteredBooks = allBooks.filter(book => book.stallId === currentStall);
        filteredSales = allSales.filter(sale => sale.stallId === currentStall);
      }
      
      setBooks(filteredBooks);
      setSales(filteredSales);
      
      // Calculate total revenue
      const revenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      setTotalRevenue(revenue);
      
      // Calculate low stock count
      const lowStock = filteredBooks.filter(book => book.quantity < 5).length;
      setLowStockCount(lowStock);
      
      // Calculate top selling books
      const bookSalesCount: Record<string, {id: string, name: string, count: number}> = {};
      filteredSales.forEach(sale => {
        const book = filteredBooks.find(b => b.id === sale.bookId);
        if (book) {
          if (!bookSalesCount[book.id]) {
            bookSalesCount[book.id] = { id: book.id, name: book.name, count: 0 };
          }
          bookSalesCount[book.id].count += sale.quantity;
        }
      });
      
      const topBooks = Object.values(bookSalesCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      setTopSellingBooks(topBooks);
    };
    
    fetchData();
    
    // Re-fetch data when returning to the page or when currentStall changes
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, [currentStall]);

  const handleCodeScanned = (code: string) => {
    const book = books.find(b => b.id === code || b.barcode === code);
    if (book) {
      navigate(`/sell/${book.id}`);
    } else {
      alert("Book not found! Please try again or search manually.");
    }
  };

  // Get today's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales.filter(
    sale => new Date(sale.createdAt).getTime() >= today.getTime()
  );
  
  // Get recent sales for display
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title="Temple Book Sutra" 
        showBackButton={false} 
        showSearchButton={true} 
        showStallSelector={true}
        onSearch={() => navigate("/search")}
      />
      
      <main className="mobile-container">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatsCard 
            title="Books" 
            value={books.length} 
            icon={<BookOpen className="text-temple-maroon" size={18} />}
          />
          <StatsCard 
            title="Sales Today" 
            value={todaySales.length} 
            trend="up" 
            trendValue={`${todaySales.length > 0 ? '+' : ''}${todaySales.length}`}
            icon={<TrendingUp className="text-temple-maroon" size={18} />}
          />
          <StatsCard 
            title="Revenue" 
            value={`₹${totalRevenue}`} 
            icon={<BarChart2 className="text-temple-maroon" size={18} />}
          />
          <StatsCard 
            title="Low Stock" 
            value={lowStockCount} 
            trend={lowStockCount > 0 ? "down" : "neutral"}
            trendValue={lowStockCount > 0 ? "Need restock" : "All good"}
            icon={<BookOpen className="text-temple-maroon" size={18} />}
          />
        </div>
        
        {/* Scan Button */}
        <div className="mb-4">
          <ScannerButton onCodeScanned={handleCodeScanned} />
        </div>
        
        {/* Top Selling Books */}
        {topSellingBooks.length > 0 && (
          <Card className="mobile-card mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-temple-maroon">Top Selling Books</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {topSellingBooks.map((book, index) => (
                  <div 
                    key={book.id} 
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-temple-gold/10"
                    onClick={() => navigate(`/sell/${book.id}`)}
                  >
                    <div className="flex items-center">
                      <div className="bg-temple-saffron/10 text-temple-saffron rounded-full w-6 h-6 flex items-center justify-center mr-3">
                        {index + 1}
                      </div>
                      <span className="font-medium">{book.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{book.count} sold</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Quick Actions */}
        <Card className="mobile-card mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-temple-maroon">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="bg-temple-saffron hover:bg-temple-saffron/90 h-auto py-3 flex flex-col items-center"
                onClick={() => navigate("/books")}
              >
                <BookOpen size={24} className="mb-1" />
                <span>View Books</span>
              </Button>
              
              <Button
                className="bg-temple-gold hover:bg-temple-gold/90 h-auto py-3 flex flex-col items-center"
                onClick={() => navigate("/sales")}
              >
                <BarChart2 size={24} className="mb-1" />
                <span>Sales History</span>
              </Button>
              
              {isAdmin && (
                <Button
                  className="bg-temple-maroon hover:bg-temple-maroon/90 h-auto py-3 flex flex-col items-center"
                  onClick={() => navigate("/add-book")}
                >
                  <PlusCircle size={24} className="mb-1" />
                  <span>Add Book</span>
                </Button>
              )}
              
              <Button
                className="bg-gray-100 hover:bg-gray-200 text-temple-maroon h-auto py-3 flex flex-col items-center"
                variant="outline"
                onClick={() => navigate("/search")}
              >
                <Search size={24} className="mb-1" />
                <span>Search</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Sales */}
        <Card className="temple-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-temple-maroon">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map(sale => {
                  const book = books.find(b => b.id === sale.bookId);
                  return (
                    <div key={sale.id} className="flex justify-between items-center border-b border-border pb-2">
                      <div>
                        <p className="font-medium">{book?.name || "Unknown Book"}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {sale.quantity} • {new Date(sale.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-temple-saffron">₹{sale.totalAmount}</p>
                    </div>
                  );
                })}
                
                {recentSales.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 text-temple-maroon border-temple-gold/20"
                    onClick={() => navigate("/sales")}
                  >
                    View All Sales
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No sales recorded yet</p>
                <p className="text-sm mt-1">Scan a book barcode to make a sale</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;
