
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Book } from "@/types";
import MobileHeader from "@/components/MobileHeader";
import { useToast } from "@/hooks/use-toast";
import { useBookManager } from "@/hooks/useBookManager";
import BookPageHeader from "@/components/books/BookPageHeader";
import BookListContainer from "@/components/books/BookListContainer";
import DeleteBookDialogContainer from "@/components/books/DeleteBookDialogContainer";

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
    showLowStockOnly,
    toggleLowStockFilter,
    deleteBook,
    refreshBooks
  } = useBookManager(currentStore);
  
  // Handle book editing - navigate to edit page with book ID
  const handleEditBook = (book: Book) => {
    console.log("DEBUG: Edit button clicked for book:", book.id, book.name);
    if (book && book.id) {
      console.log("DEBUG: About to navigate to edit page:", `/books/edit/${book.id}`);
      try {
        navigate(`/books/edit/${book.id}`);
        console.log("DEBUG: Navigation command executed");
      } catch (error) {
        console.error("DEBUG: Navigation error:", error);
        toast({
          title: t("common.error"),
          description: "Navigation failed",
          variant: "destructive",
        });
      }
    } else {
      console.error("DEBUG: Book or book ID is missing:", book);
      toast({
        title: t("common.error"),
        description: "Book information is missing",
        variant: "destructive",
      });
    }
  };
  
  // Handle book selling - navigate to sell page with book ID
  const handleSellBook = (book: Book) => {
    console.log("DEBUG: Sell button clicked for book:", book.id, book.name);
    if (book && book.id) {
      if (book.quantity > 0) {
        console.log("DEBUG: About to navigate to sell page:", `/sell/${book.id}`);
        try {
          navigate(`/sell/${book.id}`);
          console.log("DEBUG: Sell navigation command executed");
        } catch (error) {
          console.error("DEBUG: Sell navigation error:", error);
          toast({
            title: t("common.error"),
            description: "Navigation failed",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: t("common.error"),
          description: t("sell.outOfStock"),
          variant: "destructive",
        });
      }
    } else {
      console.error("DEBUG: Book or book ID is missing for sell:", book);
      toast({
        title: t("common.error"),
        description: "Book information is missing",
        variant: "destructive",
      });
    }
  };
  
  // Handle book deletion
  const handleBookDelete = (book: Book) => {
    console.log("DEBUG: Delete button clicked for book:", book.id, book.name);
    setSelectedBook(book);
    setIsDeleteDialogOpen(true);
  };

  // Delete the selected book
  const handleDeleteConfirm = async () => {
    if (!selectedBook) return;
    
    try {
      const success = await deleteBook(selectedBook.id);
      
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedBook(null);
      }
    } catch (error) {
      console.error("Error deleting book:", error);
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
        <BookPageHeader 
          exportBooks={books}
          isAdmin={isAdmin}
        />
        
        <BookListContainer
          books={books}
          isLoading={isLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          showLowStockOnly={showLowStockOnly}
          onToggleLowStock={toggleLowStockFilter}
          clearFilters={clearFilters}
          handleEditBook={handleEditBook}
          handleDeleteBook={handleBookDelete}
          handleSellBook={handleSellBook}
        />
      </main>
      
      <DeleteBookDialogContainer
        isOpen={isDeleteDialogOpen}
        selectedBook={selectedBook}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDeleteConfirm}
      />
    </div>
  );
};

export default BooksPage;
