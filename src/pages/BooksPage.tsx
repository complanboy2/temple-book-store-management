
import React, { useEffect, useState } from "react";
import { Book } from "@/types";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import BookCard from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ScannerButton from "@/components/ScannerButton";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("createdat", { ascending: false });

      if (error) {
        console.error("Error fetching books from Supabase:", error);
        setBooks([]);
        setFilteredBooks([]);
        return;
      }

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

      setBooks(result);
      setFilteredBooks(result);
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    let results = books;
    if (searchTerm) {
      results = results.filter(book => 
        book.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory) {
      results = results.filter(book => book.category === selectedCategory);
    }
    setFilteredBooks(results);
  }, [searchTerm, selectedCategory, books]);

  const handleBookSelect = (book: Book) => {
    navigate(`/sell/${book.id}`);
  };

  const handleCodeScanned = (code: string) => {
    const book = books.find(b => b.id === code || b.barcode === code);
    if (book) {
      navigate(`/sell/${book.id}`);
    } else {
      alert("Book not found! Please try again or search manually.");
    }
  };

  // Get unique categories
  const categories = Array.from(new Set(books.map(book => book.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-temple-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon mb-4 md:mb-0">Books Inventory</h1>
          <Button
            onClick={() => navigate("/add-book")}
            className="bg-temple-saffron hover:bg-temple-saffron/90"
          >
            Add New Book
          </Button>
        </div>
        <div className="mb-6">
          <ScannerButton onCodeScanned={handleCodeScanned} />
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search books by name, author..."
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
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} onSelect={handleBookSelect} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No books found matching your search criteria.</p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
              variant="link"
              className="mt-2 text-temple-saffron"
            >
              Clear filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default BooksPage;
