import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";
import { supabase } from "@/integrations/supabase/client";
import { Book } from "@/types";
import { useStallContext } from "@/contexts/StallContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import BookImage from "@/components/BookImage";

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { currentStore } = useStallContext();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      
      if (!currentStore) {
        setAllBooks([]);
        setFilteredBooks([]);
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .eq('stallid', currentStore);
          
        if (error) {
          throw error;
        }
        
        // Map database fields to Book type fields
        const books = data.map(item => ({
          id: item.id,
          barcode: item.barcode,
          name: item.name,
          author: item.author,
          category: item.category,
          printingInstitute: item.printinginstitute,
          originalPrice: item.originalprice,
          salePrice: item.saleprice,
          quantity: item.quantity,
          stallId: item.stallid,
          imageUrl: item.imageurl,
          createdAt: new Date(item.createdat),
          updatedAt: new Date(item.updatedat)
        })) as Book[];
        
        setAllBooks(books);
        setFilteredBooks(books);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(books.map(book => book.category || "")))
          .filter(category => category !== "");
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching books:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBooks"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBooks();
  }, [currentStore, toast, t]);
  
  useEffect(() => {
    // Filter books based on search term and category
    let results = allBooks;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(book => 
        (book.name && book.name.toLowerCase().includes(term)) || 
        (book.author && book.author.toLowerCase().includes(term)) ||
        (book.printingInstitute && book.printingInstitute.toLowerCase().includes(term))
      );
    }
    
    if (selectedCategory) {
      results = results.filter(book => book.category === selectedCategory);
    }
    
    setFilteredBooks(results);
  }, [searchTerm, selectedCategory, allBooks]);
  
  const handleClearSearch = () => {
    setSearchTerm("");
    setSelectedCategory("");
  };
  
  const handleViewBook = async (bookId: string) => {
    try {
      // Verify the book exists before navigating
      const { data, error } = await supabase
        .from('books')
        .select('id')
        .eq('id', bookId)
        .single();
        
      if (error || !data) {
        toast({
          title: t("common.error"),
          description: t("common.bookNotFound"),
          variant: "destructive",
        });
        return;
      }
      
      navigate(`/sell/${bookId}`);
    } catch (error) {
      console.error("Error checking book:", error);
      toast({
        title: t("common.error"),
        description: t("common.failedToLoadBookDetails"),
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.searchBooks")} 
        showBackButton={true} 
        showStallSelector={true} 
      />
      
      <div className="mobile-container">
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder={t("common.searchBooksPlaceholder") || "Search by name, author, publisher..."}
            className="pl-10 pr-10 py-6 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button 
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={handleClearSearch}
            >
              <X size={18} className="text-gray-400" />
            </button>
          )}
        </div>
        
        {/* Category Filter */}
        <div className="mb-4 overflow-x-auto pb-2">
          <div className="flex space-x-2">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              className={!selectedCategory 
                ? "bg-temple-saffron hover:bg-temple-saffron/90 text-white whitespace-nowrap" 
                : "border-temple-gold/30 text-temple-maroon whitespace-nowrap"
              }
              onClick={() => setSelectedCategory("")}
            >
              {t("common.all")}
            </Button>
            
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={selectedCategory === category 
                  ? "bg-temple-saffron hover:bg-temple-saffron/90 text-white whitespace-nowrap" 
                  : "border-temple-gold/30 text-temple-maroon whitespace-nowrap"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Results */}
        {isLoading ? (
          <div className="text-center py-10">
            <p>{t("common.loading")}...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBooks.length > 0 ? (
              filteredBooks.map(book => (
                <div 
                  key={book.id}
                  className="mobile-card cursor-pointer"
                  onClick={() => handleViewBook(book.id)}
                >
                  <div className="flex items-start space-x-3">
                    <BookImage
                      imageUrl={book.imageUrl}
                      alt={book.name}
                      className="w-16 h-16 rounded flex-shrink-0"
                    />
                    <div className="flex-grow">
                      <h3 className="font-medium text-temple-maroon">{book.name}</h3>
                      <p className="text-sm text-gray-600">{t("common.by")} {book.author}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm bg-temple-saffron/10 text-temple-saffron px-2 py-1 rounded">
                          {book.category || t("common.uncategorized")}
                        </span>
                        <span className="font-bold text-temple-maroon">₹{book.salePrice}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>{t("common.publisher")}: {book.printingInstitute || t("common.notSpecified")}</span>
                        <span>{t("common.availableQuantity")}: {book.quantity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">{t("common.noBooks")}</p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    className="mt-2 border-temple-gold/30 text-temple-maroon"
                    onClick={handleClearSearch}
                  >
                    {t("common.clearFilters")}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
