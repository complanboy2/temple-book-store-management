
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, Filter, BookOpen } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import BookImage from "@/components/BookImage";

interface Book {
  id: string;
  name: string;
  author: string;
  category: string;
  language?: string;
  printinginstitute?: string;
  originalprice: number;
  saleprice: number;
  quantity: number;
  imageurl?: string;
  barcode?: string;
}

const BooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { currentStore } = useStallContext();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we should show low stock filter
  const showLowStockOnly = location.search.includes('filter=lowStock') || location.search.includes('lowStock=true');

  useEffect(() => {
    if (currentStore) {
      fetchBooks();
    }
  }, [currentStore]);

  useEffect(() => {
    applyFilters();
  }, [books, searchTerm, selectedCategory, showLowStockOnly]);

  const fetchBooks = async () => {
    if (!currentStore) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('stallid', currentStore)
        .order('name');

      if (error) throw error;

      setBooks(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set((data || []).map(book => book.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast({
        title: t("common.error"),
        description: t("books.failedToLoadBooks"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = books;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      
      // FIXED: Exact match for book codes (numeric search)
      if (/^\d+$/.test(searchLower)) {
        // Pure numeric search - exact match for book codes
        filtered = books.filter(book => book.barcode === searchLower);
      } else {
        // Text search in name, author, category, barcode
        filtered = filtered.filter(book =>
          book.name.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower) ||
          book.category?.toLowerCase().includes(searchLower) ||
          book.barcode?.toLowerCase().includes(searchLower)
        );
      }
    }

    // FIXED: Apply category filter - handle "all" category properly
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }

    // Apply low stock filter
    if (showLowStockOnly) {
      filtered = filtered.filter(book => book.quantity <= 5);
    }

    setFilteredBooks(filtered);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={showLowStockOnly ? t("books.lowStockItems") : t("common.books")}
        showBackButton={true}
        backTo="/"
        rightContent={
          isAdmin && (
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white"
              onClick={() => navigate("/books/add")}
            >
              <Plus size={18} />
            </Button>
          )
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
                placeholder={t("books.searchBooks")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t("books.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("books.allCategories")}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          {showLowStockOnly ? (
            <p>{t("books.showingLowStock", { count: filteredBooks.length })}</p>
          ) : (
            <p>{t("books.showingResults", { count: filteredBooks.length, total: books.length })}</p>
          )}
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-temple-maroon mx-auto"></div>
            <p className="mt-2 text-muted-foreground">{t("common.loading")}</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showLowStockOnly ? t("books.noLowStockBooks") : t("books.noBooksFound")}
              </h3>
              <p className="text-gray-500 mb-4">
                {showLowStockOnly 
                  ? t("books.allBooksWellStocked")
                  : searchTerm || selectedCategory !== "all"
                    ? t("books.tryDifferentSearch")
                    : t("books.addFirstBook")
                }
              </p>
              {isAdmin && !showLowStockOnly && (
                <Button 
                  onClick={() => navigate("/books/add")}
                  className="bg-temple-maroon hover:bg-temple-maroon/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("books.addBook")}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Book Image */}
                    <div className="w-20 h-28 flex-shrink-0">
                      <BookImage 
                        imageUrl={book.imageurl} 
                        alt={book.name}
                        size="medium"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Book Details */}
                    <div className="flex-1 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 leading-tight mb-1">
                            {book.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {t("common.by")} {book.author}
                          </p>
                          {book.category && (
                            <p className="text-xs text-gray-500 mb-2">
                              {book.category}
                            </p>
                          )}
                        </div>
                        
                        {/* Stock Status */}
                        <div className="text-right ml-4">
                          <div className={`text-sm font-medium ${
                            book.quantity <= 5 ? 'text-red-600' : 
                            book.quantity <= 10 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {book.quantity} {t("common.inStock")}
                          </div>
                          <div className="text-lg font-bold text-temple-maroon">
                            ₹{book.saleprice}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1 bg-temple-maroon hover:bg-temple-maroon/90"
                          onClick={() => navigate(`/books/sell/${book.id}`)}
                        >
                          {t("common.sell")}
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/books/edit/${book.id}`)}
                          >
                            {t("common.edit")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BooksPage;
