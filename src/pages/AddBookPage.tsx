
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getBooks, 
  setBooks, 
  generateId, 
  getBookStalls, 
  getAuthors, 
  getCategories,
  getPrintingInstitutes,
  getAuthorSalePercentage
} from "@/services/storageService";
import { Book } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";

const AddBookPage: React.FC = () => {
  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [printingInstitute, setPrintingInstitute] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [barcode, setBarcode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Lists for selection
  const [authors, setAuthors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [institutes, setInstitutes] = useState<string[]>([]);
  const [authorPercentages, setAuthorPercentages] = useState<Record<string, number>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { currentStore } = useStallContext();

  useEffect(() => {
    // Load dropdowns data
    setAuthors(getAuthors());
    setCategories(getCategories());
    setInstitutes(getPrintingInstitutes() || []);
    setAuthorPercentages(getAuthorSalePercentage());
  }, []);

  // Calculate sale price based on original price and author percentage
  useEffect(() => {
    if (originalPrice && author && authorPercentages[author]) {
      const original = parseFloat(originalPrice);
      if (!isNaN(original)) {
        const percentage = authorPercentages[author] / 100;
        // Calculate: original price + (original price * percentage)
        const calculatedSalePrice = original + (original * percentage);
        setSalePrice(calculatedSalePrice.toFixed(2));
      }
    }
  }, [originalPrice, author, authorPercentages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (!currentStore) {
        toast({
          title: t("common.error"),
          description: "No store selected. Please select a store first.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const newBook: Book = {
        id: generateId(),
        barcode: barcode || undefined,
        name,
        author,
        category,
        printingInstitute,
        originalPrice: parseFloat(originalPrice),
        salePrice: parseFloat(salePrice),
        quantity: parseInt(quantity),
        stallId: currentStore,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save to local storage
      const books = getBooks();
      setBooks([...books, newBook]);
      
      // Also save to Supabase
      const { error } = await supabase.from("books").insert({
        id: newBook.id,
        name: newBook.name,
        author: newBook.author,
        category: newBook.category,
        printinginstitute: newBook.printingInstitute,
        originalprice: newBook.originalPrice,
        saleprice: newBook.salePrice,
        quantity: newBook.quantity,
        stallid: newBook.stallId,
        barcode: newBook.barcode || null,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      });
      
      if (error) {
        console.error("Error adding book to Supabase:", error);
        // Continue anyway as we have added to local storage
      }
      
      toast({
        title: t("common.bookAdded"),
        description: `"${name}" ${t("common.addedToInventory")}`,
      });
      
      navigate("/books");
    } catch (error) {
      console.error("Error adding book:", error);
      toast({
        title: t("common.error"),
        description: t("common.failedToAddBook"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!name || !author || !printingInstitute || !originalPrice || !salePrice || !quantity) {
      toast({
        title: t("common.validationError"),
        description: t("common.fillRequiredFields"),
        variant: "destructive",
      });
      return false;
    }
    
    if (isNaN(parseFloat(originalPrice)) || isNaN(parseFloat(salePrice)) || isNaN(parseInt(quantity))) {
      toast({
        title: t("common.validationError"),
        description: t("common.priceQuantityMustBeNumbers"),
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleManageMetadata = () => {
    navigate("/metadata-manager");
  };

  // Show author percentage if available
  const getAuthorPercentageDisplay = () => {
    if (author && authorPercentages[author]) {
      return `(${authorPercentages[author]}% royalty)`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.addBook")} 
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-temple-maroon">{t("common.addNewBook")}</h1>
          <Button 
            variant="outline" 
            onClick={handleManageMetadata}
            className="text-temple-maroon border-temple-maroon hover:bg-temple-maroon/10"
          >
            {t("common.manageMetadata")}
          </Button>
        </div>
        
        <Card className="temple-card max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-lg font-medium">
                  {t("common.bookName")}*
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="temple-input w-full"
                  placeholder={t("common.enterBookName")}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-lg font-medium">
                  {t("common.author")}* {getAuthorPercentageDisplay()}
                </label>
                <Select value={author} onValueChange={setAuthor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("common.selectAuthor")} />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground">
                        {t("common.noAuthors")}
                      </div>
                    ) : (
                      authors.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a} {authorPercentages[a] ? `(${authorPercentages[a]}%)` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-lg font-medium">
                  {t("common.category")}{" "}
                  <span className="text-[12px] text-gray-400">({t("common.optional")})</span>
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("common.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground">
                        {t("common.noCategories")}
                      </div>
                    ) : (
                      categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-lg font-medium">
                  {t("common.printingInstitute")}*
                </label>
                <Select value={printingInstitute} onValueChange={setPrintingInstitute}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("common.selectInstitute")} />
                  </SelectTrigger>
                  <SelectContent>
                    {institutes.length === 0 ? (
                      <div className="p-2 text-center text-muted-foreground">
                        {t("common.noInstitutes")}
                      </div>
                    ) : (
                      institutes.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="originalPrice" className="text-lg font-medium">
                    {t("common.originalPrice")} (₹)*
                  </label>
                  <input
                    id="originalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    required
                    className="temple-input w-full"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="salePrice" className="text-lg font-medium">
                    {t("common.salePrice")} (₹)*
                  </label>
                  <input
                    id="salePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    required
                    className="temple-input w-full"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-lg font-medium">
                  {t("common.quantity")}*
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="temple-input w-full"
                  placeholder={t("common.enterQuantity")}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="barcode" className="text-lg font-medium">
                  {t("common.barcode")} ({t("common.optional")})
                </label>
                <input
                  id="barcode"
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="temple-input w-full"
                  placeholder={t("common.enterBarcode")}
                />
              </div>
              
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="temple-button w-full"
                >
                  {isLoading ? t("common.addingBook") : t("common.addBookToInventory")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddBookPage;
