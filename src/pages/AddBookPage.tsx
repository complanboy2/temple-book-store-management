import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateId } from "@/services/storageService";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/ImageUpload";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";

const AddBookPage = () => {
  const [bookCode, setBookCode] = useState("");
  const [name, setName] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [printingInstitute, setPrintingInstitute] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorPercentage, setAuthorPercentage] = useState(0);
  const [nextBookCode, setNextBookCode] = useState(1);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    fetchNextBookCode();
  }, [currentStore]);

  useEffect(() => {
    // Calculate sale price when original price or author percentage changes
    if (originalPrice && authorPercentage) {
      const original = parseFloat(originalPrice);
      const percentage = parseFloat(authorPercentage.toString());
      const calculated = original + (original * percentage / 100);
      setSalePrice(calculated.toFixed(2));
    }
  }, [originalPrice, authorPercentage]);

  const fetchNextBookCode = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('books')
        .select('id')
        .eq('stallid', currentStore)
        .order('createdat', { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching book count:", error);
        return;
      }

      // Get total count to generate next sequential code
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
      setLanguage("");
      setPrintingInstitute("");
      setOriginalPrice("");
      setSalePrice("");
      setQuantity("");
      setImageUrl("");
      setAuthorPercentage(0);
      
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
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("addBook.addNewBook")}
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-4 py-6">
        <Card className="temple-card">
          <CardHeader>
            <CardTitle>{t("addBook.bookDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="bookCode">{t("addBook.bookCode")}</Label>
                <Input
                  id="bookCode"
                  value={bookCode}
                  onChange={(e) => setBookCode(e.target.value)}
                  placeholder={t("addBook.enterBookCode")}
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">{t("addBook.bookName")} *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("addBook.enterBookName")}
                  required
                />
              </div>

              <div>
                <Label htmlFor="author">{t("addBook.author")} *</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={t("addBook.enterAuthor")}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">{t("addBook.category")}</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={t("addBook.enterCategory")}
                />
              </div>

              <div>
                <Label htmlFor="language">{t("addBook.language")}</Label>
                <Input
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder={t("addBook.enterLanguage")}
                />
              </div>

              <div>
                <Label htmlFor="printingInstitute">{t("addBook.printingInstitute")}</Label>
                <Input
                  id="printingInstitute"
                  value={printingInstitute}
                  onChange={(e) => setPrintingInstitute(e.target.value)}
                  placeholder={t("addBook.enterPrintingInstitute")}
                />
              </div>

              <div>
                <Label htmlFor="originalPrice">{t("addBook.originalPrice")} *</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => handleOriginalPriceChange(e.target.value)}
                  placeholder={t("addBook.enterOriginalPrice")}
                  required
                  onFocus={(e) => {
                    if (e.target.value === "0") {
                      setOriginalPrice("");
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="authorPercentage">{t("addBook.authorPercentage")} (%)</Label>
                <Input
                  id="authorPercentage"
                  type="number"
                  step="0.1"
                  min="0"
                  value={authorPercentage}
                  onChange={(e) => setAuthorPercentage(parseFloat(e.target.value) || 0)}
                  placeholder="Enter percentage markup"
                />
              </div>

              <div>
                <Label htmlFor="salePrice">{t("addBook.salePrice")} *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder={t("addBook.enterSalePrice")}
                  required
                  onFocus={(e) => {
                    if (e.target.value === "0") {
                      setSalePrice("");
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="quantity">{t("addBook.quantity")} *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={t("addBook.enterQuantity")}
                  required
                />
              </div>

              <div>
                <Label>{t("addBook.bookImage")}</Label>
                <ImageUpload 
                  onImageUploaded={setImageUrl}
                  initialImageUrl={imageUrl}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-temple-maroon hover:bg-temple-maroon/90"
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
