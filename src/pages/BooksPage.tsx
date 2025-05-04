
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BookList from "@/components/BookList";
import BookFilter from "@/components/BookFilter";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Book } from "@/types";
import MobileHeader from "@/components/MobileHeader";
import ScannerButton from "@/components/ScannerButton";
import BookImage from "@/components/BookImage";
import { useToast } from "@/hooks/use-toast";
import DeleteBookDialog from "@/components/DeleteBookDialog";
import { useBookManager } from "@/hooks/useBookManager";

const BooksPage = () => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const {
    filteredBooks: books,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    deleteBook,
    refreshBooks
  } = useBookManager(currentStore);
  
  // Refresh books data when component mounts or when current store changes
  useEffect(() => {
    refreshBooks();
  }, [currentStore, refreshBooks]);
  
  const handleScanComplete = (barcode: string) => {
    // Find the book by barcode
    const book = books.find(book => book.barcode === barcode);
    
    if (book) {
      navigate(`/sell/${book.id}`);
    } else {
      toast({
        title: t("common.error"),
        description: t("common.bookNotFound"),
        variant: "destructive",
      });
    }
  };
  
  // Handle book editing - navigate to edit page with book ID
  const handleEditBook = (book: Book) => {
    if (book && book.id) {
      navigate(`/books/edit/${book.id}`);
    }
  };
  
  // Handle book selling - navigate to sell page with book ID
  const handleSellBook = (book: Book) => {
    if (book && book.id) {
      if (book.quantity > 0) {
        console.log("Selling book:", book.id, book.name);
        navigate(`/sell/${book.id}`);
      } else {
        toast({
          title: t("common.error"),
          description: t("sell.outOfStock"),
          variant: "destructive",
        });
      }
    }
  };
  
  // Handle book deletion
  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    
    try {
      const success = await deleteBook(selectedBook.id);
      
      if (success) {
        toast({
          title: t("common.success"),
          description: t("common.bookDeleted"),
        });
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: t("common.error"),
        description: t("common.deleteBookFailed"),
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedBook(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };
  
  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader
        title={t("common.books")}
        showBackButton={true}
        backTo="/"
        showStallSelector={true}
        showSearchButton={true}
        onSearch={() => navigate("/search")}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">{t("common.booksInventory")}</h1>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {isAdmin && (
              <ScannerButton
                onScanComplete={handleScanComplete}
              />
            )}
            
            {isAdmin && (
              <button 
                onClick={() => navigate("/books/add")}
                className="bg-temple-saffron hover:bg-temple-saffron/90 text-white px-4 py-2 rounded flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {t("common.addBook")}
              </button>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <BookFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
          />
        </div>
        
        <BookList 
          books={books}
          isLoading={isLoading}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          onClearFilters={clearFilters}
          onBookSelect={handleSellBook}
          onEdit={handleEditBook}
          onDelete={(book) => {
            setSelectedBook(book);
            setIsDeleteDialogOpen(true);
          }}
          onSell={handleSellBook}
          ImageComponent={BookImage}
        />
      </main>
      
      <DeleteBookDialog
        isOpen={isDeleteDialogOpen}
        bookTitle={selectedBook?.name || ""}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDeleteBook}
      />
    </div>
  );
};

export default BooksPage;
