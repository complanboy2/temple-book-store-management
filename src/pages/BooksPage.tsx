
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Book } from "@/types";
import MobileHeader from "@/components/MobileHeader";
import ScannerButton from "@/components/ScannerButton";
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
    deleteBook,
    refreshBooks
  } = useBookManager(currentStore);
  
  // Transform books for export
  const getExportBooks = () => {
    return books.map(book => ({
      id: book.id,
      name: book.name,
      author: book.author,
      price: book.salePrice,
      quantity: book.quantity,
      category: book.category,
      printingInstitute: book.printingInstitute,
      imageurl: book.imageUrl,
      // We'd need to fetch sales data to get quantitySold, using 0 as placeholder
      quantitySold: 0
    }));
  };
  
  // Handle scan completion
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
      console.log("Editing book:", book.id, book.name);
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
  const handleBookDelete = (book: Book) => {
    setSelectedBook(book);
    setIsDeleteDialogOpen(true);
  };

  // Delete the selected book
  const handleDeleteConfirm = async () => {
    if (!selectedBook) return;
    
    try {
      const success = await deleteBook(selectedBook.id);
      
      if (success) {
        // Toast is already shown in deleteBook function
        setIsDeleteDialogOpen(false);
        setSelectedBook(null);
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      // Error toast already shown in deleteBook function
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
          exportBooks={getExportBooks()} 
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

      <ScannerButton onScanComplete={handleScanComplete} />
    </div>
  );
};

export default BooksPage;
