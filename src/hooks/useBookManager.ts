
import { useState, useEffect } from "react";
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
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      
      if (!stallId) {
        console.log("No store selected, cannot fetch books");
        setBooks([]);
        setFilteredBooks([]);
        setIsLoading(false);
        return;
      }

      console.log(`Fetching books for store ID: ${stallId}`);

      try {
        console.log("Making Supabase query for books");
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("stallid", stallId)
          .order('createdat', { ascending: false });
          
        if (error) {
          console.error("Error fetching books from Supabase:", error);
          toast({
            title: "Error",
            description: "Error fetching books. Please try again.",
            variant: "destructive",
          });
          setBooks([]);
          setFilteredBooks([]);
          setIsLoading(false);
          return;
        }

        console.log("Supabase returned books data:", data);

        if (data && Array.isArray(data)) {
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
          setBooks(result);
          setFilteredBooks(result);
        }
      } catch (err) {
        console.error("Unexpected error fetching books:", err);
        toast({
          title: "Error",
          description: "Unexpected error fetching books. Please try again.",
          variant: "destructive",
        });
        setBooks([]);
        setFilteredBooks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, [stallId, toast, t]);

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
          title: "Error",
          description: "Failed to delete book. Please try again.",
          variant: "destructive",
        });
        return false;
      }
      
      // Remove the deleted book from state
      const updatedBooks = books.filter(book => book.id !== bookId);
      setBooks(updatedBooks);
      
      // Update filtered books
      setFilteredBooks(updatedBooks.filter(book => 
        (!selectedCategory || book.category === selectedCategory) &&
        (!searchTerm || 
          book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (book.category && book.category.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      ));
      
      toast({
        title: "Success",
        description: "Book deleted successfully",
      });
      
      return true;
    } catch (err) {
      console.error("Unexpected error deleting book:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the book",
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
  };
};
