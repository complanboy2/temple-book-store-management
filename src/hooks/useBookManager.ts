
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Book } from "@/types";

export const useBookManager = (currentStore: string | null) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'lowStock') {
      setShowLowStockOnly(true);
    }
  }, [searchParams]);

  const ensureBookCodesExist = async () => {
    if (!currentStore) return;

    try {
      const { data: booksWithoutCodes, error } = await supabase
        .from('books')
        .select('id, barcode')
        .eq('stallid', currentStore)
        .or('barcode.is.null,barcode.eq.""');

      if (error) {
        console.error("Error checking book codes:", error);
        return;
      }

      if (booksWithoutCodes && booksWithoutCodes.length > 0) {
        console.log(`Found ${booksWithoutCodes.length} books without codes. Updating...`);
        
        for (const book of booksWithoutCodes) {
          const bookCode = `BOOK-${book.id.slice(-6).toUpperCase()}`;
          const { error: updateError } = await supabase
            .from('books')
            .update({ barcode: bookCode })
            .eq('id', book.id);

          if (updateError) {
            console.error(`Error updating book code for ${book.id}:`, updateError);
          }
        }
      }
    } catch (error) {
      console.error("Error ensuring book codes exist:", error);
    }
  };

  const fetchBooks = async () => {
    if (!currentStore) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await ensureBookCodesExist();

      const { data: supabaseBooks, error } = await supabase
        .from('books')
        .select('*')
        .eq('stallid', currentStore)
        .order('name');
      
      if (error) {
        console.error("Error fetching books:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBooks"),
          variant: "destructive",
        });
        return;
      }

      const formattedBooks: Book[] = (supabaseBooks || []).map((book) => ({
        id: book.id,
        bookCode: book.barcode || `BOOK-${book.id.slice(-6).toUpperCase()}`,
        name: book.name,
        author: book.author,
        category: book.category || "",
        language: book.language || "",
        printingInstitute: book.printinginstitute || "",
        originalPrice: book.originalprice || 0,
        salePrice: book.saleprice || 0,
        quantity: book.quantity || 0,
        stallId: book.stallid,
        imageUrl: book.imageurl,
        createdAt: book.createdat ? new Date(book.createdat) : new Date(),
        updatedAt: book.updatedat ? new Date(book.updatedat) : new Date()
      }));
      
      console.log("DEBUG: Fetched books with codes:", formattedBooks.map(b => ({ id: b.id, bookCode: b.bookCode, name: b.name })));
      
      setBooks(formattedBooks);
      
      const uniqueCategories = [...new Set(formattedBooks.map(book => book.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: t("common.error"),
        description: t("common.failedToLoadBooks"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBooks = () => {
    fetchBooks();
  };

  const deleteBook = async (bookId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) {
        console.error("Error deleting book:", error);
        toast({
          title: t("common.error"),
          description: t("common.deleteBookFailed"),
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: t("common.success"),
        description: t("common.bookDeleted"),
      });

      await fetchBooks();
      return true;
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: t("common.error"),
        description: t("common.deleteBookFailed"),
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    let filtered = books;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      console.log("DEBUG: Searching for:", searchLower);
      console.log("DEBUG: All available book codes:", books.map(b => b.bookCode?.toLowerCase()));
      
      // Check for exact book code match first
      const exactBookCodeMatch = filtered.find(book => 
        book.bookCode?.toLowerCase() === searchLower ||
        book.bookCode?.toLowerCase() === `book-${searchLower}`
      );
      
      if (exactBookCodeMatch) {
        console.log("DEBUG: Exact book code match found:", exactBookCodeMatch.name);
        filtered = [exactBookCodeMatch];
      } else {
        // Check if it's a numeric search (for partial book code matching)
        const isNumericSearch = /^\d+$/.test(searchLower);
        
        if (isNumericSearch) {
          console.log("DEBUG: Numeric search detected for:", searchLower);
          
          // Look for book codes that end with this number (after the hyphen)
          const numericMatches = filtered.filter(book => {
            const bookCodeParts = book.bookCode?.toLowerCase().split('-');
            if (bookCodeParts && bookCodeParts.length > 1) {
              const codeNumber = bookCodeParts[1];
              // Check if the code number ends with our search term
              return codeNumber.endsWith(searchLower);
            }
            return false;
          });
          
          if (numericMatches.length > 0) {
            // If we have an exact match (code number equals search term), return only that
            const exactNumericMatch = numericMatches.find(book => {
              const bookCodeParts = book.bookCode?.toLowerCase().split('-');
              return bookCodeParts && bookCodeParts[1] === searchLower;
            });
            
            if (exactNumericMatch) {
              console.log("DEBUG: Exact numeric match found:", exactNumericMatch.name);
              filtered = [exactNumericMatch];
            } else {
              console.log("DEBUG: Partial numeric matches found:", numericMatches.length);
              filtered = numericMatches;
            }
          } else {
            console.log("DEBUG: No numeric matches found");
            filtered = [];
          }
        } else {
          // Non-numeric search - search in all fields
          filtered = filtered.filter(book => {
            const nameMatch = book.name.toLowerCase().includes(searchLower);
            const authorMatch = book.author.toLowerCase().includes(searchLower);
            const categoryMatch = book.category.toLowerCase().includes(searchLower);
            const idMatch = book.id.toLowerCase().includes(searchLower);
            const bookCodeMatch = book.bookCode?.toLowerCase().includes(searchLower);
            
            return nameMatch || authorMatch || categoryMatch || idMatch || bookCodeMatch;
          });
          console.log("DEBUG: Text search returned:", filtered.length, "results");
        }
      }
    }

    if (selectedCategory) {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }

    if (showLowStockOnly) {
      filtered = filtered.filter(book => book.quantity <= 5);
    }

    console.log("DEBUG: Final filtered results:", filtered.length);
    setFilteredBooks(filtered);
  }, [books, searchTerm, selectedCategory, showLowStockOnly]);

  useEffect(() => {
    fetchBooks();
  }, [currentStore]);

  const toggleLowStockFilter = () => {
    setShowLowStockOnly(prev => !prev);
  };

  return {
    books,
    filteredBooks,
    categories,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showLowStockOnly,
    toggleLowStockFilter,
    deleteBook,
    refreshBooks
  };
};
