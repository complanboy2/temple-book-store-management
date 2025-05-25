import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";
import MetadataInput from "@/components/MetadataInput";
import { getImageUrl } from "@/services/imageService";

const AddBookPage = () => {
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
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [institutes, setInstitutes] = useState<string[]>([]);
  
  const { currentStore } = useStallContext();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch existing metadata
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "originalPrice" || name === "salePrice" || name === "quantity") {
      const numValue = parseFloat(value);
      setFormData((prev) => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
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
    if (!currentStore || !currentUser) return;
    
    try {
      setIsSaving(true);
      
      let imageUrl = null;
      
      if (selectedImage) {
        console.log("Uploading image...");
        imageUrl = await getImageUrl(selectedImage);
        if (!imageUrl) {
          toast({
            title: t("common.error"),
            description: t("common.imageUploadFailed"),
            variant: "destructive",
          });
          return;
        }
      }
      
      const { error } = await supabase
        .from("books")
        .insert({
          name: formData.name,
          author: formData.author,
          category: formData.category || null,
          printinginstitute: formData.printingInstitute || null,
          originalprice: formData.originalPrice,
          saleprice: formData.salePrice,
          quantity: formData.quantity,
          barcode: formData.barcode || null,
          stallid: currentStore,
          imageurl: imageUrl,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: t("common.success"),
        description: t("common.bookAdded"),
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
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader
        title={t("common.addBook")}
        showBackButton={true}
        backTo="/books"
      />
      
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-temple-maroon mb-6">{t("common.addBook")}</h1>
        
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">{t("common.image")}</Label>
              <ImageUpload 
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
              <Label htmlFor="name">{t("common.bookName")}</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required
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
                {isSaving ? t("common.saving") : t("common.addBook")}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default AddBookPage;
