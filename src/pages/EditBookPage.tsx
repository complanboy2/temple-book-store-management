
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
import { uploadBookImage } from "@/services/imageService";

const EditBookPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    author: "",
    category: "",
    printingInstitute: "",
    originalPrice: 0,
    salePrice: 0,
    quantity: 0,
    barcode: ""
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  
  const { currentStore } = useStallContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch all available categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!currentStore) return;
      
      try {
        const { data, error } = await supabase
          .from("books")
          .select("category")
          .eq("stallid", currentStore)
          .not("category", "is", null);
          
        if (!error && data) {
          // Extract unique categories
          const uniqueCategories = Array.from(new Set(data
            .map(item => item.category)
            .filter(Boolean)
          )).sort();
          
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    
    fetchCategories();
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
          barcode: data.barcode ?? undefined,
          name: data.name,
          author: data.author,
          category: data.category ?? "",
          printingInstitute: data.printinginstitute ?? "",
          originalPrice: data.originalprice,
          salePrice: data.saleprice,
          quantity: data.quantity,
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
          printingInstitute: bookData.printingInstitute || "",
          originalPrice: bookData.originalPrice,
          salePrice: bookData.salePrice,
          quantity: bookData.quantity,
          barcode: bookData.barcode || ""
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "originalPrice" || name === "salePrice" || name === "quantity") {
      const numValue = parseFloat(value);
      setFormData((prev) => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };
  
  const handleImageChange = (file: File | null) => {
    setSelectedImage(file);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !currentStore) return;
    
    try {
      setIsSaving(true);
      
      let imageUrl = book.imageUrl;
      
      // Upload new image if selected
      if (selectedImage) {
        const uploadResult = await uploadBookImage(selectedImage);
        if (uploadResult) {
          imageUrl = uploadResult.url;
        }
      }
      
      const { error } = await supabase
        .from("books")
        .update({
          name: formData.name,
          author: formData.author,
          category: formData.category || null,
          printinginstitute: formData.printingInstitute || null,
          originalprice: formData.originalPrice,
          saleprice: formData.salePrice,
          quantity: formData.quantity,
          barcode: formData.barcode || null,
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
      
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-temple-maroon mb-6">{t("common.editBook")}</h1>
        
        {book ? (
          <Card className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">{t("common.image")}</Label>
                <ImageUpload 
                  initialImageUrl={book.imageUrl} 
                  onImageChange={handleImageChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("common.bookName")}</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="author">{t("common.author")}</Label>
                <Input 
                  id="author" 
                  name="author" 
                  value={formData.author} 
                  onChange={handleInputChange} 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">{t("common.category")}</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("common.uncategorized")}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="printingInstitute">{t("common.printingInstitute")}</Label>
                <Input 
                  id="printingInstitute" 
                  name="printingInstitute" 
                  value={formData.printingInstitute} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">{t("common.originalPrice")}</Label>
                  <Input 
                    id="originalPrice" 
                    name="originalPrice" 
                    type="number" 
                    value={formData.originalPrice} 
                    onChange={handleInputChange} 
                    required
                    min={0}
                    step={0.01}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salePrice">{t("common.salePrice")}</Label>
                  <Input 
                    id="salePrice" 
                    name="salePrice" 
                    type="number" 
                    value={formData.salePrice} 
                    onChange={handleInputChange} 
                    required
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">{t("common.quantity")}</Label>
                <Input 
                  id="quantity" 
                  name="quantity" 
                  type="number" 
                  value={formData.quantity} 
                  onChange={handleInputChange} 
                  required
                  min={0}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="barcode">{t("common.barcode")}</Label>
                <Input 
                  id="barcode" 
                  name="barcode" 
                  value={formData.barcode} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/books")}
                >
                  {t("common.cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
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
