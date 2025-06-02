
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Filter } from "lucide-react";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import MobileHeader from "@/components/MobileHeader";
import BookList from "@/components/BookList";
import { Book } from "@/types";

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [quantityOperator, setQuantityOperator] = useState("");
  const [quantityValue, setQuantityValue] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const { t } = useTranslation();

  useEffect(() => {
    if (currentStore) {
      fetchAllBooks();
      fetchAuthors();
    }
  }, [currentStore]);

  useEffect(() => {
    const initialSearch = searchParams.get('q');
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [searchParams]);

  const fetchAllBooks = async () => {
    if (!currentStore) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('stallid', currentStore)
        .order('name');

      if (error) {
        console.error("Error fetching books:", error);
        return;
      }

      const formattedBooks: Book[] = (data || []).map((book) => ({
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

      setAllBooks(formattedBooks);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuthors = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('books')
        .select('author')
        .eq('stallid', currentStore)
        .order('author');

      if (error) {
        console.error("Error fetching authors:", error);
        return;
      }

      const uniqueAuthors = [...new Set(data?.map(book => book.author).filter(Boolean))];
      setAuthors(uniqueAuthors);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  const filteredBooks = useMemo(() => {
    let filtered = allBooks;

    if (searchTerm.trim()) {
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

    if (selectedAuthor) {
      filtered = filtered.filter(book => book.author === selectedAuthor);
    }

    if (quantityOperator && quantityValue) {
      const qtyVal = parseInt(quantityValue);
      if (quantityOperator === 'less_than') {
        filtered = filtered.filter(book => book.quantity < qtyVal);
      } else if (quantityOperator === 'more_than') {
        filtered = filtered.filter(book => book.quantity > qtyVal);
      }
    }

    return filtered;
  }, [allBooks, searchTerm, selectedAuthor, quantityOperator, quantityValue]);

  useEffect(() => {
    setBooks(filteredBooks);
  }, [filteredBooks]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedAuthor("");
    setQuantityOperator("");
    setQuantityValue("");
    setBooks([]);
  };

  const performSearch = () => {
    // Search is already performed via useMemo
    setBooks(filteredBooks);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader 
        title={t("common.searchBooks")}
        showBackButton={true}
      />
      
      <main className="container mx-auto px-3 py-4">
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              {t("common.searchFilters")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">{t("common.searchByCodeNameAuthor")}</Label>
              <Input
                id="search"
                placeholder={t("common.searchByCodeNameAuthor")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="author" className="text-sm font-medium">{t("common.filterByAuthor")}</Label>
              <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t("common.selectAuthor")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("common.allAuthors")}</SelectItem>
                  {authors.map(author => (
                    <SelectItem key={author} value={author}>
                      {author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">{t("common.filterByQuantity")}</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Select value={quantityOperator} onValueChange={setQuantityOperator}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.selectOperator")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("common.noFilter")}</SelectItem>
                    <SelectItem value="less_than">{t("common.lessThan")}</SelectItem>
                    <SelectItem value="more_than">{t("common.moreThan")}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder={t("common.enterQuantity")}
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  disabled={!quantityOperator}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={performSearch} className="flex-1 bg-gray-700 hover:bg-gray-800">
                <Search className="h-4 w-4 mr-2" />
                {t("common.search")}
              </Button>
              <Button onClick={clearFilters} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                {t("common.clear")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <BookList 
          books={books}
          isLoading={isLoading}
          onEdit={(book) => navigate(`/books/edit/${book.id}`)}
          onSell={(book) => navigate(`/sell/${book.id}`)}
        />
      </main>
    </div>
  );
};

export default SearchPage;
