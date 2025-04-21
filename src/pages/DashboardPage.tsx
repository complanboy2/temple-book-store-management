
import React, { useEffect, useState } from "react";
import { getBooks, getSales } from "@/services/storageService";
import { Book, Sale } from "@/types";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScannerButton from "@/components/ScannerButton";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

const DashboardPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const fetchData = () => {
      const allBooks = getBooks();
      const allSales = getSales();
      setBooks(allBooks);
      setSales(allSales);
      
      // Calculate total revenue
      const revenue = allSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      setTotalRevenue(revenue);
      
      // Calculate low stock count
      const lowStock = allBooks.filter(book => book.quantity < 5).length;
      setLowStockCount(lowStock);
    };
    
    fetchData();
    
    // Re-fetch data when returning to the page
    const intervalId = setInterval(fetchData, 5000);
    return () => clearInterval(intervalId);
  }, []);

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
    <div className="min-h-screen bg-temple-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-temple-maroon mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            title="Total Books" 
            value={books.length} 
            description="Available in inventory"
          />
          <StatsCard 
            title="Books Sold Today" 
            value={todaySales.length} 
            trend="up" 
            trendValue={`${todaySales.length > 0 ? '+' : ''}${todaySales.length} today`}
          />
          <StatsCard 
            title="Total Revenue" 
            value={`₹${totalRevenue}`} 
            description="From all sales"
          />
          <StatsCard 
            title="Low Stock Alert" 
            value={lowStockCount} 
            description="Items below threshold"
            trend={lowStockCount > 0 ? "down" : "neutral"}
            trendValue={lowStockCount > 0 ? "Needs restocking" : "All good"}
          />
        </div>
        
        <div className="mb-6">
          <ScannerButton onCodeScanned={handleCodeScanned} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Card className="temple-card">
              <CardHeader>
                <CardTitle className="text-lg text-temple-maroon">Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSales.length > 0 ? (
                  <div className="space-y-4">
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
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No sales recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-5">
            <Card className="temple-card h-full">
              <CardHeader>
                <CardTitle className="text-lg text-temple-maroon">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    className="bg-temple-saffron hover:bg-temple-saffron/90 w-full py-6 text-lg"
                    onClick={() => navigate("/books")}
                  >
                    📚 View All Books
                  </Button>
                  
                  <Button
                    className="bg-temple-gold hover:bg-temple-gold/90 w-full py-6 text-lg"
                    onClick={() => navigate("/sales")}
                  >
                    💰 View Sales History
                  </Button>
                  
                  {isAdmin && (
                    <>
                      <Button
                        className="bg-temple-maroon hover:bg-temple-maroon/90 w-full py-6 text-lg"
                        onClick={() => navigate("/add-book")}
                      >
                        ➕ Add New Book
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="border-temple-maroon text-temple-maroon hover:bg-temple-maroon/10 w-full py-6 text-lg"
                        onClick={() => navigate("/reports")}
                      >
                        📊 View Reports
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
