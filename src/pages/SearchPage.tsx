
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MobileHeader from "@/components/MobileHeader";
import { getBooks } from "@/services/storageService";
import { Book } from "@/types";
import { useStallContext } from "@/contexts/StallContext";

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { currentStall } = useStallContext();
  
  useEffect(() => {
    const books = getBooks();
    
    // Filter by current stall if available
    const filteredByStall = currentStall 
      ? books.filter(book => book.stallId === currentStall) 
      : books;
      
    setAllBooks(filteredByStall);
    
    // Extract unique categories
    const uniqueCategories = Array.from(new Set(filteredByStall.map(book => book.category)));
    setCategories(uniqueCategories);
    
    // Initial search results
    setFilteredBooks(filteredByStall);
  }, [currentStall]);
  
  useEffect(() => {
    // Filter books based on search term and category
    let results = allBooks;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(book => 
        book.name.toLowerCase().includes(term) || 
        book.author.toLowerCase().includes(term) ||
        book.printingInstitute.toLowerCase().includes(term)
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
  
  const handleViewBook = (bookId: string) => {
    navigate(`/sell/${bookId}`);
  };
  
  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader title="Search Books" showBackButton={true} showStallSelector={true} />
      
      <div className="mobile-container">
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search by name, author, publisher..."
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
              All
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
        <div className="space-y-3">
          {filteredBooks.length > 0 ? (
            filteredBooks.map(book => (
              <div 
                key={book.id}
                className="mobile-card cursor-pointer"
                onClick={() => handleViewBook(book.id)}
              >
                <h3 className="font-medium text-temple-maroon">{book.name}</h3>
                <p className="text-sm text-gray-600">By {book.author}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm bg-temple-saffron/10 text-temple-saffron px-2 py-1 rounded">
                    {book.category}
                  </span>
                  <span className="font-bold text-temple-maroon">₹{book.salePrice}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>Publisher: {book.printingInstitute}</span>
                  <span>Stock: {book.quantity}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">No books found</p>
              {searchTerm && (
                <Button
                  variant="outline"
                  className="mt-2 border-temple-gold/30 text-temple-maroon"
                  onClick={handleClearSearch}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
