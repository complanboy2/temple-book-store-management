import React, { useState, useEffect } from "react";
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
  const [quantityFilter, setQuantityFilter] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentStore } = useStallContext();
  const { t } = useTranslation();

  useEffect(() => {
    fetchAuthors();
    const initialSearch = searchParams.get('q');
    if (initialSearch) {
      setSearchTerm(initialSearch);
    }
  }, [currentStore, searchParams]);

  useEffect(() => {
    if (searchTerm || selectedAuthor || quantityFilter) {
      performSearch();
    } else {
      setBooks([]);
    }
  }, [searchTerm, selectedAuthor, quantityFilter, currentStore]);

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

  const performSearch = async () => {
    if (!currentStore) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from('books')
        .select('*')
        .eq('stallid', currentStore);

      // Search by name, author, category, or printing institute
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,printinginstitute.ilike.%${searchTerm}%`);
      }

      // Filter by author
      if (selectedAuthor) {
        query = query.eq('author', selectedAuthor);
      }

      // Filter by quantity
      if (quantityFilter) {
        switch (quantityFilter) {
          case 'less_than_10':
            query = query.lt('quantity', 10);
            break;
          case 'less_than_50':
            query = query.lt('quantity', 50);
            break;
          case 'more_than_20':
            query = query.gt('quantity', 20);
            break;
          case 'between_10_50':
            query = query.gte('quantity', 10).lte('quantity', 50);
            break;
        }
      }

      const { data, error } = await query.order('name');

      if (error) {
        console.error("Search error:", error);
        return;
      }

      const formattedBooks: Book[] = (data || []).map((book, index) => ({
        id: book.id,
        bookCode: (index + 1).toString(), // Generate sequential book code
        name: book.name,
        author: book.author,
        category: book.category || "",
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
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedAuthor("");
    setQuantityFilter("");
    setBooks([]);
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.searchBooks")}
        showBackButton={true}
      />
      
      <main className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t("common.searchFilters")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">{t("common.searchByCodeNameAuthor")}</Label>
              <Input
                id="search"
                placeholder={t("common.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="author">{t("common.filterByAuthor")}</Label>
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
              <Label htmlFor="quantity">{t("common.filterByQuantity")}</Label>
              <Select value={quantityFilter} onValueChange={setQuantityFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t("common.selectQuantityRange")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("common.allQuantities")}</SelectItem>
                  <SelectItem value="less_than_10">Less than 10</SelectItem>
                  <SelectItem value="less_than_50">Less than 50</SelectItem>
                  <SelectItem value="more_than_20">More than 20</SelectItem>
                  <SelectItem value="between_10_50">Between 10-50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={performSearch} className="flex-1">
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
