
import { useState, useEffect, useCallback } from "react";
import { Book } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const useBookManager = (stallId: string | null) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();

  const fetchBooks = useCallback(async (forceRefresh = false) => {
    if (!stallId) {
      console.log("No store selected, cannot fetch books");
      setBooks([]);
      setFilteredBooks([]);
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    const CACHE_TIME = 60000; // 1 minute in milliseconds
    
    // Skip refetching if we fetched recently, unless forced
    if (!forceRefresh && now - lastFetchTime < CACHE_TIME && books.length > 0) {
      console.log("Using cached books data, last fetch was", (now - lastFetchTime) / 1000, "seconds ago");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Fetching books for store ID:", stallId);
      console.log("Making Supabase query for books");
      
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("stallid", stallId)
        .order('createdat', { ascending: false });
        
      if (error) {
        console.error("Error fetching books from Supabase:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBooks"),
          variant: "destructive",
        });
        setBooks([]);
        setFilteredBooks([]);
        setIsLoading(false);
        return;
      }

      if (data && Array.isArray(data)) {
        console.log("Supabase returned books data:", data);
        // Transform API result to local Book type
        const result: Book[] = data.map((row: any) => ({
          id: row.id,
          barcode: row.barcode ?? undefined,
          name: row.name,
          author: row.author,
          category: row.category ?? "",
          printingInstitute: row.printinginstitute ?? "",
          originalPrice: row.originalprice,
          salePrice: row.saleprice,
          quantity: row.quantity,
          stallId: row.stallid,
          imageUrl: row.imageurl,
          createdAt: row.createdat ? new Date(row.createdat) : new Date(),
          updatedAt: row.updatedat ? new Date(row.updatedat) : new Date()
        }));

        console.log(`Fetched ${result.length} books for store ${stallId}`);
        setLastFetchTime(now);
        setBooks(result);
        setFilteredBooks(result);
      }
    } catch (err) {
      console.error("Unexpected error fetching books:", err);
      toast({
        title: t("common.error"),
        description: t("common.failedToLoadBooks"),
        variant: "destructive",
      });
      setBooks([]);
      setFilteredBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, [stallId, toast, t]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    let results = books;
    if (searchTerm) {
      results = results.filter(book => 
        book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.category && book.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedCategory) {
      results = results.filter(book => book.category === selectedCategory);
    }
    setFilteredBooks(results);
  }, [searchTerm, selectedCategory, books]);

  const deleteBook = async (bookId: string) => {
    if (!stallId) return false;
    
    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId)
        .eq("stallid", stallId);
        
      if (error) {
        console.error("Error deleting book:", error);
        toast({
          title: t("common.error"),
          description: t("common.deleteBookFailed"),
          variant: "destructive",
        });
        return false;
      }
      
      // Update local state
      const updatedBooks = books.filter(book => book.id !== bookId);
      setBooks(updatedBooks);
      
      // Update filtered books
      setFilteredBooks(prevFiltered => 
        prevFiltered.filter(book => book.id !== bookId)
      );
      
      toast({
        title: t("common.success"),
        description: t("common.bookDeleted"),
      });
      
      return true;
    } catch (err) {
      console.error("Unexpected error deleting book:", err);
      toast({
        title: t("common.error"),
        description: t("common.deleteBookFailed"),
        variant: "destructive",
      });
      return false;
    }
  };

  // Get unique categories from actual books for dropdown
  const categories = Array.from(new Set(books
    .map(book => book.category)
    .filter(Boolean)
  )).sort();

  return {
    books,
    filteredBooks,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    categories,
    deleteBook,
    refreshBooks: () => fetchBooks(true),
  };
};
