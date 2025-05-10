
import { useState, useEffect, useCallback, useRef } from "react";
import { Book } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { 
  cacheBooks, 
  getCachedBooks, 
  clearExpiredCaches, 
  cacheBookDetails, 
  getCachedBookDetails 
} from "@/services/localStorageService";

export const useBookManager = (stallId: string | null) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isCached, setIsCached] = useState(false);
  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);
  const initialFetchDone = useRef(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Clear expired caches on mount
  useEffect(() => {
    clearExpiredCaches();
  }, []);

  // Stable fetch function that doesn't recreate on each render
  const fetchBooks = useCallback(async (forceRefresh = false) => {
    // Guard clauses to prevent redundant fetches
    if (!stallId) {
      console.log("No store selected, cannot fetch books");
      if (isMounted.current) {
        setIsLoading(false);
      }
      return;
    }
    
    if (!isMounted.current) {
      console.log("Component unmounted, skipping fetch");
      return;
    }
    
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    const now = Date.now();
    const CACHE_TIME = 60000; // 1 minute in milliseconds
    
    // Skip refetching if we fetched recently, unless forced
    if (!forceRefresh && now - lastFetchTime < CACHE_TIME && books.length > 0) {
      console.log(`Using in-memory books data, last fetch was ${(now - lastFetchTime) / 1000} seconds ago`);
      return;
    }

    try {
      fetchInProgress.current = true;
      setIsLoading(true);
      
      // First try to get books from local storage cache
      if (!forceRefresh) {
        const cachedBooks = getCachedBooks(stallId);
        if (cachedBooks && cachedBooks.length > 0) {
          console.log(`Using ${cachedBooks.length} cached books from localStorage`);
          if (isMounted.current) {
            setBooks(cachedBooks);
            setIsCached(true);
            setLastFetchTime(now);
            applyFilters(cachedBooks, searchTerm, selectedCategory);
            setIsLoading(false);
            fetchInProgress.current = false;
            initialFetchDone.current = true;
            
            // After using cache, trigger background refresh if it's older than 5 minutes
            const cacheAge = now - lastFetchTime;
            if (cacheAge > 5 * 60 * 1000) { // 5 minutes
              console.log("Cache is older than 5 minutes, refreshing in background");
              setTimeout(() => fetchBooksFromAPI(stallId), 100);
            }
            
            return;
          }
        }
      }
      
      // If no cache or forced refresh, fetch from API
      await fetchBooksFromAPI(stallId);
      
    } catch (err) {
      console.error("Unexpected error fetching books:", err);
      toast({
        title: t("common.error"),
        description: t("common.failedToLoadBooks"),
        variant: "destructive",
      });
    } finally {
      fetchInProgress.current = false;
      if (isMounted.current) {
        setIsLoading(false);
        initialFetchDone.current = true;
      }
    }
  }, [stallId, toast, t, books.length, searchTerm, selectedCategory, lastFetchTime]);

  const fetchBooksFromAPI = async (stallId: string) => {
    console.log("Fetching books from API for store ID:", stallId);
    
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
      return;
    }

    if (data && Array.isArray(data)) {
      console.log(`Fetched ${data.length} books for store ${stallId}`);
      
      // Transform API result to local Book type
      const result: Book[] = data.map((row: any) => ({
        id: row.id,
        barcode: row.barcode ?? "",
        name: row.name,
        author: row.author,
        category: row.category ?? "",
        printingInstitute: row.printinginstitute ?? "",
        originalPrice: row.originalprice,
        salePrice: row.saleprice,
        quantity: row.quantity,
        stallId: row.stallid,
        imageUrl: row.imageUrl || row.imageurl,
        createdAt: row.createdat ? new Date(row.createdat) : new Date(),
        updatedAt: row.updatedat ? new Date(row.updatedat) : new Date()
      }));

      // Cache the books in localStorage
      cacheBooks(result, stallId);
      setIsCached(false);

      if (isMounted.current) {
        setLastFetchTime(Date.now());
        setBooks(result);
        applyFilters(result, searchTerm, selectedCategory);
      }
    } else {
      // Handle case when data is null or not an array
      console.warn("Unexpected data format returned from Supabase:", data);
      if (isMounted.current) {
        setBooks([]);
        setFilteredBooks([]);
      }
    }
  };

  // Helper function to apply filters
  const applyFilters = (booksToFilter: Book[], search: string, category: string) => {
    let results = [...booksToFilter];
    
    // Filter by low stock if URL contains lowStock=true
    const urlParams = new URLSearchParams(window.location.search);
    const lowStockFilter = urlParams.get('lowStock');
    
    if (lowStockFilter === "true") {
      console.log("Filtering for low stock books");
      results = results.filter(book => (book.quantity ?? 0) < 5);
    }
    
    if (search) {
      results = results.filter(book => 
        book.name.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase()) ||
        (book.category && book.category.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (category) {
      results = results.filter(book => book.category === category);
    }
    
    setFilteredBooks(results);
  };

  // Initial fetch on mount or stallId change
  useEffect(() => {
    console.log("useEffect for initial fetch triggered with stallId:", stallId);
    
    // Only fetch if stallId exists and initial fetch hasn't been done
    if (stallId && !initialFetchDone.current) {
      fetchBooks();
    }
    
    // No cleanup needed for this effect
  }, [stallId, fetchBooks]);

  // Setup mount/unmount handling
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      console.log("Component unmounting, cleaning up");
      isMounted.current = false;
    };
  }, []);

  // Filter books when search term or category changes
  useEffect(() => {
    applyFilters(books, searchTerm, selectedCategory);
  }, [searchTerm, selectedCategory, books]);

  // Listen for URL parameter changes
  useEffect(() => {
    const handleURLChange = () => {
      applyFilters(books, searchTerm, selectedCategory);
    };
    
    // Set up listener for popstate event (back/forward navigation)
    window.addEventListener('popstate', handleURLChange);
    
    // Also apply filters on initial mount
    handleURLChange();
    
    return () => {
      window.removeEventListener('popstate', handleURLChange);
    };
  }, [books, searchTerm, selectedCategory]);

  // Delete book functionality
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
      setFilteredBooks(prevFiltered => 
        prevFiltered.filter(book => book.id !== bookId)
      );
      
      // Update cache
      cacheBooks(updatedBooks, stallId);
      
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

  // Create a stable refreshBooks function
  const refreshBooks = useCallback(() => {
    console.log("Manual refresh requested");
    return fetchBooks(true);
  }, [fetchBooks]);

  return {
    books,
    filteredBooks,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    isCached,
    categories,
    deleteBook,
    refreshBooks,
  };
};
