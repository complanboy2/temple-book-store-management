import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BookList from "@/components/BookList";
import { supabase } from "@/integrations/supabase/client";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Book } from "@/types";
import MobileHeader from "@/components/MobileHeader";
import ScannerButton from "@/components/ScannerButton";
import BookImage from "@/components/BookImage";
import { useToast } from "@/hooks/use-toast";
import DeleteBookDialog from "@/components/DeleteBookDialog";
import BookFilter from "@/components/BookFilter";

const BooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      if (!currentStore) {
        setBooks([]);
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
        
        setBooks(books);
      } catch (error) {
        console.error("Error fetching books:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBooks"),
          variant: "destructive",
        });
        setBooks([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBooks();
  }, [currentStore, toast, t]);
  
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
  
  // Handle book deletion
  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', selectedBook.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: t("common.success"),
        description: t("common.bookDeleted"),
      });
      
      // Refresh books
      setBooks(books.filter(book => book.id !== selectedBook.id));
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
                onScanComplete={(barcode) => {
                  // Handle scan result
                  handleScanComplete(barcode);
                }}
              />
            )}
            
            {isAdmin && (
              <button 
                onClick={() => navigate("/add-book")}
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
        
        <BookFilter 
          onFilterChange={(filteredBooks) => setBooks(filteredBooks)} 
          stallId={currentStore || ""}
        />
        
        <BookList 
          books={books} 
          onEdit={book => navigate(`/books/${book.id}`)} 
          onDelete={(book) => {
            setSelectedBook(book);
            setIsDeleteDialogOpen(true);
          }}
          onSell={(book) => {
            if (book.quantity > 0) {
              navigate(`/sell/${book.id}`);
            } else {
              toast({
                title: t("common.error"),
                description: t("sell.outOfStock"),
                variant: "destructive",
              });
            }
          }}
          ImageComponent={BookImage}
        />
      </main>
      
      <DeleteBookDialog
        isOpen={isDeleteDialogOpen}
        bookName={selectedBook?.name || ""}
        onClose={() => setIsDeleteDialogOpen(false)}
        onDelete={handleDeleteBook}
      />
    </div>
  );
};

export default BooksPage;
