
import React, { useEffect, useState } from "react";
import { Book } from "@/types";
import { useNavigate } from "react-router-dom";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ScannerButton from "@/components/ScannerButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MobileHeader from "@/components/MobileHeader";
import { useStallContext } from "@/contexts/StallContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);
      
      if (!currentStore) {
        console.log("No store selected, cannot fetch books");
        setBooks([]);
        setFilteredBooks([]);
        setIsLoading(false);
        return;
      }

      console.log(`Fetching books for store ID: ${currentStore}`);

      try {
        console.log("Making Supabase query for books");
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("stallid", currentStore);
          
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

        // Transform API result to local Book type
        const result: Book[] = (data || []).map((row: any) => ({
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
          createdAt: row.createdat ? new Date(row.createdat) : new Date(),
          updatedAt: row.updatedat ? new Date(row.updatedat) : new Date()
        }));

        console.log(`Fetched ${result.length} books for store ${currentStore}`);
        setBooks(result);
        setFilteredBooks(result);
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
  }, [currentStore, toast, t]);

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

  // Get unique categories from actual books for dropdown
  const categories = Array.from(new Set(books
    .map(book => book.category)
    .filter(Boolean)
  )).sort();

  console.log("Available categories:", categories);

  const handleBookSelect = (book: Book) => {
    navigate(`/sell/${book.id}`);
  };

  const handleCodeScanned = (code: string) => {
    const book = books.find(b => b.id === code || b.barcode === code);
    if (book) {
      navigate(`/sell/${book.id}`);
    } else {
      toast({
        title: "Book Not Found",
        description: t("common.bookNotFound"),
        variant: "destructive",
      });
    }
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
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">{t("common.booksInventory")}</h1>
          <Button
            onClick={() => navigate("/add-book")}
            className="bg-temple-saffron hover:bg-temple-saffron/90"
          >
            {t("common.addNewBook")}
          </Button>
        </div>
        
        <div className="mb-6">
          <ScannerButton onCodeScanned={handleCodeScanned} />
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              id="searchInput"
              placeholder={t("common.searchBooks")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="temple-input pl-10 w-full"
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder={t("common.allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-categories" value="">{t("common.allCategories")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">{t("common.loading")}...</p>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} onSelect={handleBookSelect} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">{t("common.noBooks")}</p>
            {(searchTerm || selectedCategory) && (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                }}
                variant="link"
                className="mt-2 text-temple-saffron"
              >
                {t("common.clearFilters")}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BooksPage;
