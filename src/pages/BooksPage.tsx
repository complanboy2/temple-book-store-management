
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Book } from "@/types";
import MobileHeader from "@/components/MobileHeader";
import ScannerButton from "@/components/ScannerButton";
import ExportBookListButton from "@/components/ExportBookListButton";
import BookFilter from "@/components/BookFilter";
import BookList from "@/components/BookList";
import DeleteBookDialog from "@/components/DeleteBookDialog";
import { useBookManager } from "@/hooks/useBookManager";
import { useToast } from "@/hooks/use-toast";

const BooksPage: React.FC = () => {
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const {
    books,
    filteredBooks,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    categories,
    deleteBook
  } = useBookManager(currentStore);

  const handleBookSelect = (book: Book) => {
    navigate(`/sell/${book.id}`);
  };

  const handleDeleteBook = (bookId: string) => {
    setBookToDelete(bookId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookToDelete) {
      setIsDeleteDialogOpen(false);
      return;
    }

    const success = await deleteBook(bookToDelete);
    
    if (success) {
      toast({
        title: t("common.success"),
        description: t("common.bookDeletedSuccessfully"),
      });
    }
    
    setBookToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleCodeScanned = (code: string) => {
    const book = books.find(b => b.id === code || b.barcode === code);
    if (book) {
      navigate(`/sell/${book.id}`);
    } else {
      toast({
        title: t("common.bookNotFound"),
        description: t("common.bookNotFoundDescription"),
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.booksInventory")} 
        showBackButton={true}
        backTo="/"
        showSearchButton={true}
        showStallSelector={true}
        onSearch={() => document.getElementById('searchInput')?.focus()}
        mediumBand={true}
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">{t("common.booksInventory")}</h1>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => navigate("/add-book")}
              className="bg-temple-saffron hover:bg-temple-saffron/90"
            >
              {t("common.addNewBook")}
            </Button>
            
            <ExportBookListButton books={books} />
          </div>
        </div>
        
        <div className="mb-6">
          <ScannerButton onCodeScanned={handleCodeScanned} />
        </div>
        
        <BookFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />
        
        <BookList
          books={filteredBooks}
          isLoading={isLoading}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          onBookSelect={handleBookSelect}
          onDeleteBook={isAdmin ? handleDeleteBook : undefined}
          onClearFilters={clearFilters}
        />
      </main>

      <DeleteBookDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default BooksPage;
