
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
      // Check for books without book codes
      const { data: booksWithoutCodes, error } = await supabase
        .from('books')
        .select('id')
        .eq('stallid', currentStore)
        .or('bookcode.is.null,bookcode.eq.""');

      if (error) {
        console.error("Error checking book codes:", error);
        return;
      }

      // Update books without codes
      if (booksWithoutCodes && booksWithoutCodes.length > 0) {
        console.log(`Found ${booksWithoutCodes.length} books without codes. Updating...`);
        
        for (const book of booksWithoutCodes) {
          const bookCode = `BOOK-${book.id.slice(-6).toUpperCase()}`;
          const { error: updateError } = await supabase
            .from('books')
            .update({ bookcode: bookCode })
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
      // First ensure all books have codes
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
        bookCode: book.bookcode || `BOOK-${book.id.slice(-6).toUpperCase()}`,
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
      filtered = filtered.filter(book => {
        const nameMatch = book.name.toLowerCase().includes(searchLower);
        const authorMatch = book.author.toLowerCase().includes(searchLower);
        const bookCodeMatch = book.bookCode?.toLowerCase().includes(searchLower);
        const categoryMatch = book.category.toLowerCase().includes(searchLower);
        const idMatch = book.id.toLowerCase().includes(searchLower);
        
        return nameMatch || authorMatch || bookCodeMatch || categoryMatch || idMatch;
      });
    }

    if (selectedCategory) {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }

    if (showLowStockOnly) {
      filtered = filtered.filter(book => book.quantity <= 5);
    }

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
