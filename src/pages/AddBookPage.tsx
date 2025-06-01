
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/services/storageService";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import MobileHeader from "@/components/MobileHeader";
import MetadataInput from "@/components/MetadataInput";
import { useTranslation } from "react-i18next";

const AddBookPage = () => {
  const [bookCode, setBookCode] = useState("");
  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("Telugu");
  const [printingInstitute, setPrintingInstitute] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextBookCode, setNextBookCode] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [institutes, setInstitutes] = useState<string[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const languages = ["Telugu", "Hindi", "English", "Tamil", "Kannada", "Malayalam", "Bengali", "Gujarati", "Marathi", "Punjabi"];

  // Fetch metadata for dropdowns
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!currentStore) return;
      
      try {
        const { data: categoriesData } = await supabase
          .from("books")
          .select("category")
          .eq("stallid", currentStore)
          .not("category", "is", null);
          
        const { data: authorsData } = await supabase
          .from("books")
          .select("author")
          .eq("stallid", currentStore)
          .not("author", "is", null);
          
        const { data: institutesData } = await supabase
          .from("books")
          .select("printinginstitute")
          .eq("stallid", currentStore)
          .not("printinginstitute", "is", null);
          
        if (categoriesData) {
          const uniqueCategories = Array.from(new Set(categoriesData
            .map(item => item.category)
            .filter(Boolean)
          )).sort();
          setCategories(uniqueCategories);
        }
        
        if (authorsData) {
          const uniqueAuthors = Array.from(new Set(authorsData
            .map(item => item.author)
            .filter(Boolean)
          )).sort();
          setAuthors(uniqueAuthors);
        }
        
        if (institutesData) {
          const uniqueInstitutes = Array.from(new Set(institutesData
            .map(item => item.printinginstitute)
            .filter(Boolean)
          )).sort();
          setInstitutes(uniqueInstitutes);
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };
    
    fetchMetadata();
  }, [currentStore]);

  useEffect(() => {
    fetchNextBookCode();
  }, [currentStore]);

  const fetchNextBookCode = async () => {
    if (!currentStore) return;

    try {
      const { count } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('stallid', currentStore);

      const nextCode = (count || 0) + 1;
      setNextBookCode(nextCode);
      setBookCode(nextCode.toString());
    } catch (error) {
      console.error("Error fetching next book code:", error);
    }
  };

  const calculateSalePrice = (price: number): number => {
    // Add 20% author percentage and round to nearest upper multiple of 10
    const salePrice = price * 1.2;
    return Math.ceil(salePrice / 10) * 10;
  };

  const handleMetadataChange = (field: string, value: string) => {
    switch (field) {
      case 'author':
        setAuthor(value);
        break;
      case 'category':
        setCategory(value);
        break;
      case 'printingInstitute':
        setPrintingInstitute(value);
        break;
    }
  };

  const handleAddNewMetadata = (field: string, value: string) => {
    switch (field) {
      case 'author':
        setAuthors(prev => [...prev, value].sort());
        setAuthor(value);
        break;
      case 'category':
        setCategories(prev => [...prev, value].sort());
        setCategory(value);
        break;
      case 'printingInstitute':
        setInstitutes(prev => [...prev, value].sort());
        setPrintingInstitute(value);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentStore || !currentUser) {
      toast({
        title: t("common.error"),
        description: t("common.missingRequiredInformation"),
        variant: "destructive",
      });
      return;
    }

    if (!name || !author || !originalPrice || !salePrice || !quantity) {
      toast({
        title: t("common.error"),
        description: t("addBook.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const bookId = generateId();
      const currentTimestamp = new Date().toISOString();

      const { error } = await supabase
        .from('books')
        .insert({
          id: bookId,
          name: name.trim(),
          author: author.trim(),
          category: category.trim() || null,
          language: language.trim() || null,
          printinginstitute: printingInstitute.trim() || null,
          originalprice: parseFloat(originalPrice),
          saleprice: parseFloat(salePrice),
          quantity: parseInt(quantity),
          stallid: currentStore,
          imageurl: imageUrl || null,
          createdat: currentTimestamp,
          updatedat: currentTimestamp
        });

      if (error) {
        console.error("Error adding book:", error);
        throw error;
      }

      toast({
        title: t("common.success"),
        description: t("addBook.bookAdded"),
      });

      // Reset form
      setName("");
      setAuthor("");
      setCategory("");
      setLanguage("Telugu");
      setPrintingInstitute("");
      setOriginalPrice("");
      setSalePrice("");
      setQuantity("");
      setImageUrl("");
      
      // Set next book code
      setBookCode((nextBookCode + 1).toString());
      setNextBookCode(prev => prev + 1);

    } catch (error) {
      console.error("Error adding book:", error);
      toast({
        title: t("common.error"),
        description: t("addBook.errorAddingBook"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOriginalPriceChange = (value: string) => {
    if (value === "" || value === "0") {
      setOriginalPrice("");
      setSalePrice("");
      return;
    }
    setOriginalPrice(value);
    const price = parseFloat(value);
    if (!isNaN(price)) {
      setSalePrice(calculateSalePrice(price).toString());
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("addBook.addNewBook")}
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-3 py-4">
        <Card className="temple-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("addBook.bookDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="bookCode" className="text-sm font-medium">{t("addBook.bookCode")}</Label>
                <Input
                  id="bookCode"
                  value={bookCode}
                  disabled
                  className="bg-gray-100 cursor-not-allowed mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">{t("addBook.bookCodeAutoGenerated")}</p>
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-medium">{t("addBook.bookName")} *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("addBook.enterBookName")}
                  required
                  className="mt-1"
                />
              </div>

              <MetadataInput
                label={t("addBook.author") + " *"}
                value={author}
                options={authors}
                placeholder={t("addBook.selectOrAddAuthor")}
                onValueChange={(value) => handleMetadataChange("author", value)}
                onAddNew={(value) => handleAddNewMetadata("author", value)}
              />
              
              <MetadataInput
                label={t("addBook.category")}
                value={category}
                options={categories}
                placeholder={t("addBook.selectOrAddCategory")}
                onValueChange={(value) => handleMetadataChange("category", value)}
                onAddNew={(value) => handleAddNewMetadata("category", value)}
              />

              <div>
                <Label htmlFor="language" className="text-sm font-medium">{t("addBook.language")}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t("addBook.selectLanguage")} />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <MetadataInput
                label={t("addBook.printingInstitute")}
                value={printingInstitute}
                options={institutes}
                placeholder={t("addBook.selectOrAddInstitute")}
                onValueChange={(value) => handleMetadataChange("printingInstitute", value)}
                onAddNew={(value) => handleAddNewMetadata("printingInstitute", value)}
              />

              <div>
                <Label htmlFor="originalPrice" className="text-sm font-medium">{t("addBook.originalPrice")} *</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => handleOriginalPriceChange(e.target.value)}
                  placeholder={t("addBook.enterOriginalPrice")}
                  required
                  className="mt-1"
                  onFocus={(e) => {
                    if (e.target.value === "0") {
                      setOriginalPrice("");
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="salePrice" className="text-sm font-medium">{t("addBook.salePrice")} *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder={t("addBook.enterSalePrice")}
                  required
                  className="mt-1"
                  onFocus={(e) => {
                    if (e.target.value === "0") {
                      setSalePrice("");
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">{t("addBook.salePriceCalculated")}</p>
              </div>

              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">{t("addBook.quantity")} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={t("addBook.enterQuantity")}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">{t("addBook.bookImage")}</Label>
                <div className="mt-1">
                  <ImageUpload 
                    onImageUploaded={setImageUrl}
                    initialImageUrl={imageUrl}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-temple-maroon hover:bg-temple-maroon/90 mt-6 h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("common.saving") : t("addBook.addBook")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddBookPage;
