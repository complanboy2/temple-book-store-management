
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStallContext } from "@/contexts/StallContext";
import { useTranslation } from "react-i18next";
import { Book } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/ImageUpload";
import MetadataInput from "@/components/MetadataInput";
import { getImageUrl } from "@/services/imageService";
import { useAuth } from "@/contexts/AuthContext";

const EditBookPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    author: "",
    category: "",
    language: "",
    printingInstitute: "",
    originalPrice: 0,
    salePrice: 0,
    quantity: 0
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [institutes, setInstitutes] = useState<string[]>([]);
  
  const { currentStore } = useStallContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const languages = ["Telugu", "Hindi", "English", "Tamil", "Kannada", "Malayalam", "Bengali", "Gujarati", "Marathi", "Punjabi"];

  // Fetch all available categories, authors, and institutes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!currentStore) return;
      
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("books")
          .select("category")
          .eq("stallid", currentStore)
          .not("category", "is", null);
          
        // Fetch authors
        const { data: authorsData, error: authorsError } = await supabase
          .from("books")
          .select("author")
          .eq("stallid", currentStore)
          .not("author", "is", null);
          
        // Fetch printing institutes
        const { data: institutesData, error: institutesError } = await supabase
          .from("books")
          .select("printinginstitute")
          .eq("stallid", currentStore)
          .not("printinginstitute", "is", null);
          
        if (!categoriesError && categoriesData) {
          const uniqueCategories = Array.from(new Set(categoriesData
            .map(item => item.category)
            .filter(Boolean)
          )).sort();
          setCategories(uniqueCategories);
        }
        
        if (!authorsError && authorsData) {
          const uniqueAuthors = Array.from(new Set(authorsData
            .map(item => item.author)
            .filter(Boolean)
          )).sort();
          setAuthors(uniqueAuthors);
        }
        
        if (!institutesError && institutesData) {
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
    const fetchBookDetails = async () => {
      if (!currentStore || !bookId) {
        navigate("/books");
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", bookId)
          .eq("stallid", currentStore)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          toast({
            title: t("common.error"),
            description: t("common.bookNotFound"),
            variant: "destructive",
          });
          navigate("/books");
          return;
        }

        // Transform API result to local Book type
        const bookData: Book = {
          id: data.id,
          bookCode: `BOOK-${data.id.slice(-6).toUpperCase()}`,
          name: data.name,
          author: data.author,
          category: data.category ?? "",
          language: data.language ?? "",
          printingInstitute: data.printinginstitute ?? "",
          originalPrice: data.originalprice || 0,
          salePrice: data.saleprice || 0,
          quantity: data.quantity || 0,
          stallId: data.stallid,
          imageUrl: data.imageurl,
          createdAt: data.createdat ? new Date(data.createdat) : new Date(),
          updatedAt: data.updatedat ? new Date(data.updatedat) : new Date()
        };

        setBook(bookData);
        setFormData({
          name: bookData.name,
          author: bookData.author,
          category: bookData.category || "",
          language: bookData.language || "",
          printingInstitute: bookData.printingInstitute || "",
          originalPrice: bookData.originalPrice,
          salePrice: bookData.salePrice,
          quantity: bookData.quantity
        });
      } catch (error) {
        console.error("Error fetching book details:", error);
        toast({
          title: t("common.error"),
          description: t("common.failedToLoadBookDetails"),
          variant: "destructive",
        });
        navigate("/books");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId, currentStore, navigate, toast, t]);

  const calculateSalePrice = (price: number): number => {
    // Add 20% author percentage and round to nearest upper multiple of 10
    const salePrice = price * 1.2;
    return Math.ceil(salePrice / 10) * 10;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "originalPrice" || name === "salePrice" || name === "quantity") {
      const numValue = parseFloat(value) || 0;
      
      // When original price changes, automatically update sale price
      if (name === "originalPrice") {
        setFormData((prev) => ({ 
          ...prev, 
          originalPrice: numValue,
          salePrice: calculateSalePrice(numValue)
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: numValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleMetadataChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNewMetadata = (field: string, value: string) => {
    switch (field) {
      case 'author':
        setAuthors(prev => [...prev, value].sort());
        break;
      case 'category':
        setCategories(prev => [...prev, value].sort());
        break;
      case 'printingInstitute':
        setInstitutes(prev => [...prev, value].sort());
        break;
    }
  };
  
  const handleImageChange = (file: File | null) => {
    setSelectedImage(file);
  };
  
  const handleImageUploaded = (url: string) => {
    console.log("Image uploaded to:", url);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !currentStore || !currentUser) return;
    
    try {
      setIsSaving(true);
      
      let imageUrl = book.imageUrl;
      
      // Upload new image if selected
      if (selectedImage) {
        console.log("Uploading new image...");
        const uploadUrl = await getImageUrl(selectedImage);
        if (uploadUrl) {
          console.log("Image uploaded successfully:", uploadUrl);
          imageUrl = uploadUrl;
        } else {
          console.error("Failed to upload image");
          toast({
            title: t("common.error"),
            description: t("common.imageUploadFailed"),
            variant: "destructive",
          });
        }
      }
      
      const { error } = await supabase
        .from("books")
        .update({
          name: formData.name,
          author: formData.author,
          category: formData.category || null,
          language: formData.language || null,
          printinginstitute: formData.printingInstitute || null,
          originalprice: formData.originalPrice,
          saleprice: formData.salePrice,
          quantity: formData.quantity,
          updatedat: new Date().toISOString(),
          imageurl: imageUrl
        })
        .eq("id", book.id)
        .eq("stallid", currentStore);
        
      if (error) throw error;
      
      toast({
        title: t("common.success"),
        description: t("common.bookUpdated"),
      });
      
      navigate("/books");
    } catch (error) {
      console.error("Error updating book:", error);
      toast({
        title: t("common.error"),
        description: t("common.failedToUpdateBook"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-temple-background flex items-center justify-center">
        <p className="text-lg text-muted-foreground">{t("common.loading")}...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader
        title={t("common.editBook")}
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-3 py-4">
        <h1 className="text-xl font-bold text-temple-maroon mb-4">{t("common.editBook")}</h1>
        
        {book ? (
          <Card className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Book Code - Display Only */}
              <div className="space-y-2">
                <Label htmlFor="bookCode" className="text-sm font-medium">{t("addBook.bookCode")}</Label>
                <Input 
                  id="bookCode" 
                  value={book.bookCode || "Auto-generated"} 
                  disabled
                  className="bg-gray-100 cursor-not-allowed text-sm"
                />
                <p className="text-xs text-gray-500">{t("addBook.bookCodeAutoGenerated")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-medium">{t("common.image")}</Label>
                <ImageUpload 
                  initialImageUrl={book.imageUrl} 
                  onImageChange={handleImageChange}
                  onImageUploaded={handleImageUploaded}
                  bookMetadata={{
                    author: formData.author,
                    name: formData.name,
                    printingInstitute: formData.printingInstitute
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">{t("common.bookName")}</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required
                  className="text-sm"
                />
              </div>
              
              <MetadataInput
                label={t("common.author")}
                value={formData.author}
                options={authors}
                placeholder={t("common.selectAuthor")}
                onValueChange={(value) => handleMetadataChange("author", value)}
                onAddNew={(value) => handleAddNewMetadata("author", value)}
              />
              
              <MetadataInput
                label={t("common.category")}
                value={formData.category}
                options={categories}
                placeholder={t("common.selectCategory")}
                onValueChange={(value) => handleMetadataChange("category", value)}
                onAddNew={(value) => handleAddNewMetadata("category", value)}
              />

              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-medium">{t("addBook.language")}</Label>
                <Select value={formData.language} onValueChange={(value) => handleMetadataChange("language", value)}>
                  <SelectTrigger>
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
                label={t("common.printingInstitute")}
                value={formData.printingInstitute}
                options={institutes}
                placeholder={t("common.selectInstitute")}
                onValueChange={(value) => handleMetadataChange("printingInstitute", value)}
                onAddNew={(value) => handleAddNewMetadata("printingInstitute", value)}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalPrice" className="text-sm font-medium">{t("common.originalPrice")}</Label>
                  <Input 
                    id="originalPrice" 
                    name="originalPrice" 
                    type="number" 
                    value={formData.originalPrice} 
                    onChange={handleInputChange} 
                    required
                    min={0}
                    step={0.01}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salePrice" className="text-sm font-medium">{t("common.salePrice")}</Label>
                  <Input 
                    id="salePrice" 
                    name="salePrice" 
                    type="number" 
                    value={formData.salePrice} 
                    onChange={handleInputChange} 
                    required
                    min={0}
                    step={0.01}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">{t("common.quantity")}</Label>
                <Input 
                  id="quantity" 
                  name="quantity" 
                  type="number" 
                  value={formData.quantity} 
                  onChange={handleInputChange} 
                  required
                  min={0}
                  className="text-sm"
                />
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-4">
                  {t("common.lastUpdatedBy")}: {currentUser?.name || t("common.unknown")}
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/books")}
                  className="text-sm"
                >
                  {t("common.cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-temple-maroon hover:bg-temple-maroon/90 text-sm"
                >
                  {isSaving ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">{t("common.bookNotFound")}</p>
            <Button
              onClick={() => navigate("/books")}
              className="mt-4"
            >
              {t("common.backToBooks")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditBookPage;
