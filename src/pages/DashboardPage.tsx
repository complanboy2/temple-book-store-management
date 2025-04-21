
import React, { useEffect, useState } from "react";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ScannerButton from "@/components/ScannerButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";
import { BookOpen, BarChart2, PlusCircle, Search, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

const DashboardPage: React.FC = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [topSellingBooks, setTopSellingBooks] = useState<{ id: string, name: string, count: number }[]>([]);
  const [lowStockBooks, setLowStockBooks] = useState<any[]>([]);
  const [isAddStallDialogOpen, setIsAddStallDialogOpen] = useState(false);
  const [newStallName, setNewStallName] = useState("");
  const [newStallLocation, setNewStallLocation] = useState("");
  const [stalls, setStalls] = useState<any[]>([]);
  const [selectedStallId, setSelectedStallId] = useState("");
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Fetch stalls from Supabase
  useEffect(() => {
    async function fetchStalls() {
      const { data, error } = await supabase.from("book_stalls").select("*").order("createdat", { ascending: false });
      if (error) {
        setStalls([]);
        return;
      }
      setStalls(data || []);
      if (!selectedStallId && data && data.length > 0) {
        setSelectedStallId(data[0].id);
      }
    }
    fetchStalls();
  }, []);

  // Fetch books and sales from Supabase
  useEffect(() => {
    async function fetchBooksAndSales() {
      if (!selectedStallId) return;
      // Books
      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select("*")
        .eq("stallid", selectedStallId)
        .order("createdat", { ascending: false });
      // Sales
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .eq("stallid", selectedStallId)
        .order("createdat", { ascending: false });

      setBooks(booksError ? [] : booksData || []);
      setSales(salesError ? [] : salesData || []);
    }
    fetchBooksAndSales();
  }, [selectedStallId, isAddStallDialogOpen]);

  useEffect(() => {
    // Calculate analytics from fetched data
    const revenue = sales.reduce((sum, sale) => sum + (sale.totalamount ?? 0), 0);
    setTotalRevenue(revenue);

    const lowStock = books.filter(book => (book.quantity ?? 0) < 5);
    setLowStockCount(lowStock.length);
    setLowStockBooks(lowStock);

    // Top selling books
    const bookSalesMap: Record<string, { id: string, name: string, count: number }> = {};
    sales.forEach(sale => {
      const book = books.find(b => b.id === sale.bookid);
      if (book) {
        if (!bookSalesMap[book.id]) {
          bookSalesMap[book.id] = { id: book.id, name: book.name, count: 0 };
        }
        bookSalesMap[book.id].count += sale.quantity ?? 0;
      }
    });
    setTopSellingBooks(Object.values(bookSalesMap).sort((a, b) => b.count - a.count).slice(0, 3));
  }, [books, sales]);

  // Handle scan
  const handleCodeScanned = (code: string) => {
    const book = books.find(b => b.id === code || b.barcode === code);
    if (book) {
      navigate(`/sell/${book.id}`);
    } else {
      alert("Book not found! Please try again or search manually.");
    }
  };

  // Handle add stall
  async function handleAddStall() {
    if (!newStallName.trim()) return;
    const { data, error } = await supabase
      .from("book_stalls")
      .insert([
        {
          name: newStallName,
          instituteid: "default_institute",
          location: newStallLocation,
        },
      ]);
    if (!error) {
      setIsAddStallDialogOpen(false);
      setNewStallName("");
      setNewStallLocation("");
      // Refresh stalls
      const { data: stallData } = await supabase.from("book_stalls").select("*").order("createdat", { ascending: false });
      setStalls(stallData || []);
      if (stallData && stallData.length > 0) setSelectedStallId(stallData[0].id);
    }
  }

  // Card click handlers for analytics
  const analyticsLinks = {
    books: () => navigate("/books?stallId=" + selectedStallId),
    sales: () => navigate("/sales?stallId=" + selectedStallId + "&today=1"),
    revenue: () => navigate("/sales?stallId=" + selectedStallId), // Revenue page is the Sales list for filter
    lowStock: () => navigate("/books?stallId=" + selectedStallId + "&lowStock=1"),
  };

  // Quick: today's sales
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaySales = sales.filter(
    sale => new Date(sale.createdat).getTime() >= today.getTime()
  );

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title="Temple Book Sutra"
        showBackButton={false}
        showSearchButton={true}
        showStallSelector={false}
        onSearch={() => navigate("/search")}
      />

      {/* Stall Selection & Add */}
      <div className="mobile-container flex flex-col md:flex-row md:items-center gap-2 mt-3">
        <div className="flex-1">
          <select
            className="temple-input w-full md:w-auto"
            value={selectedStallId}
            onChange={e => setSelectedStallId(e.target.value)}
            disabled={stalls.length === 0}
          >
            {stalls.map(stall => (
              <option key={stall.id} value={stall.id}>
                {stall.name}
                {stall.location ? ` (${stall.location})` : ""}
              </option>
            ))}
          </select>
        </div>
        <Button
          className="bg-temple-saffron hover:bg-temple-saffron/90"
          onClick={() => setIsAddStallDialogOpen(true)}
        >
          Add Stall
        </Button>
      </div>
      {isAddStallDialogOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/40 z-30 flex items-center justify-center">
          <div className="bg-white p-5 rounded shadow-lg min-w-[320px]">
            <h2 className="text-lg font-semibold mb-3">Add a New Stall</h2>
            <Input
              placeholder="Stall Name"
              value={newStallName}
              onChange={e => setNewStallName(e.target.value)}
              className="mb-2"
            />
            <Input
              placeholder="Stall Location (optional)"
              value={newStallLocation}
              onChange={e => setNewStallLocation(e.target.value)}
              className="mb-2"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAddStallDialogOpen(false)}>Cancel</Button>
              <Button className="bg-temple-saffron" onClick={handleAddStall}>Add</Button>
            </div>
          </div>
        </div>
      )}

      <main className="mobile-container">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            tabIndex={0}
            role="button"
            onClick={analyticsLinks.books}
            className="cursor-pointer"
          >
            <StatsCard
              title="Books"
              value={books.length}
              icon={<BookOpen className="text-temple-maroon" size={18} />}
            />
          </div>
          <div
            tabIndex={0}
            role="button"
            onClick={analyticsLinks.sales}
            className="cursor-pointer"
          >
            <StatsCard
              title="Sales Today"
              value={todaySales.length}
              trend="up"
              trendValue={`${todaySales.length > 0 ? "+" : ""}${todaySales.length}`}
              icon={<TrendingUp className="text-temple-maroon" size={18} />}
            />
          </div>
          <div
            tabIndex={0}
            role="button"
            onClick={analyticsLinks.revenue}
            className="cursor-pointer"
          >
            <StatsCard
              title="Revenue"
              value={`₹${totalRevenue}`}
              icon={<BarChart2 className="text-temple-maroon" size={18} />}
            />
          </div>
          <div
            tabIndex={0}
            role="button"
            onClick={analyticsLinks.lowStock}
            className="cursor-pointer"
          >
            <StatsCard
              title="Low Stock"
              value={lowStockCount}
              trend={lowStockCount > 0 ? "down" : "neutral"}
              trendValue={lowStockCount > 0 ? "Need restock" : "All good"}
              icon={<BookOpen className="text-temple-maroon" size={18} />}
            />
          </div>
        </div>

        <div className="mb-4">
          <ScannerButton onCodeScanned={handleCodeScanned} />
        </div>

        {lowStockBooks.length > 0 && (
          <div className="mb-4 p-3 rounded bg-yellow-100 border-l-4 border-yellow-400 flex flex-col gap-1">
            <span className="font-bold text-orange-600">Low Stock Alert</span>
            {lowStockBooks.map(book => (
              <span key={book.id} className="text-xs">
                {book.name} (by {book.author}): Only <span className="font-semibold">{book.quantity}</span> left!
              </span>
            ))}
          </div>
        )}

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

        <Card className="temple-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-temple-maroon">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map(sale => {
                  const book = books.find(b => b.id === sale.bookid);
                  return (
                    <div key={sale.id} className="flex justify-between items-center border-b border-border pb-2">
                      <div>
                        <p className="font-medium">{book?.name || "Unknown Book"}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {sale.quantity} • {new Date(sale.createdat).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-temple-saffron">₹{sale.totalamount}</p>
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
