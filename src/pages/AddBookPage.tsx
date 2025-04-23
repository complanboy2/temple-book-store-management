
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Book } from "@/types";
import MobileHeader from "@/components/MobileHeader";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  getAuthors, 
  getBooks, 
  setBooks, 
  getCategories, 
  getPrintingInstitutes, 
  getAuthorSalePercentage 
} from "@/services/storageService";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Form schema definition
const bookFormSchema = z.object({
  name: z.string().min(1, "Book name is required"),
  author: z.string().min(1, "Author name is required"),
  category: z.string().optional(),
  printingInstitute: z.string().optional(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  originalPrice: z.coerce.number().positive("Price must be positive"),
  salePrice: z.coerce.number().positive("Sale price must be positive"),
  barcode: z.string().optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

const AddBookPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authors, setAuthors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [institutes, setInstitutes] = useState<string[]>([]);
  const [authorPercentages, setAuthorPercentages] = useState<Record<string, number>>({});
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const { currentStore } = useStallContext();

  useEffect(() => {
    setAuthors(getAuthors());
    setCategories(getCategories());
    setInstitutes(getPrintingInstitutes() || []);
    
    const percentages = getAuthorSalePercentage();
    console.log("Loaded author percentages:", percentages);
    setAuthorPercentages(percentages);
  }, []);

  useEffect(() => {
    if (originalPrice && author && authorPercentages[author]) {
      const original = parseFloat(originalPrice);
      if (!isNaN(original)) {
        const percentage = authorPercentages[author] || 0;
        const calculatedSalePrice = original * (1 + percentage / 100);
        console.log(`Calculating sale price: ${original} * (1 + ${percentage}/100) = ${calculatedSalePrice}`);
        form.setValue("salePrice", parseFloat(calculatedSalePrice.toFixed(2)));
      }
    }
  }, [originalPrice, author, authorPercentages]);

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      name: "",
      author: "",
      category: "",
      printingInstitute: "",
      quantity: 1,
      originalPrice: 0,
      salePrice: 0,
      barcode: "",
    },
  });

  const handleOriginalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOriginalPrice(e.target.value);
    form.setValue("originalPrice", parseFloat(e.target.value) || 0);
  };

  const handleAuthorChange = (value: string) => {
    setAuthor(value);
    form.setValue("author", value);
    
    // Recalculate sale price when author changes
    if (originalPrice && authorPercentages[value]) {
      const original = parseFloat(originalPrice);
      if (!isNaN(original)) {
        const percentage = authorPercentages[value] || 0;
        const calculatedSalePrice = original * (1 + percentage / 100);
        console.log(`Recalculating sale price due to author change: ${original} * (1 + ${percentage}/100) = ${calculatedSalePrice}`);
        form.setValue("salePrice", parseFloat(calculatedSalePrice.toFixed(2)));
      }
    }
  };

  const onSubmit = async (data: BookFormValues) => {
    if (!currentStore) {
      toast({
        title: "Error",
        description: "No store is selected. Please select a store first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a book object from form data
      const newBook: Book = {
        id: crypto.randomUUID(),
        barcode: data.barcode,
        name: data.name,
        author: data.author,
        category: data.category || "",
        printingInstitute: data.printingInstitute || "",
        originalPrice: data.originalPrice,
        salePrice: data.salePrice,
        quantity: data.quantity,
        stallId: currentStore,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log("Adding book to Supabase:", newBook);

      const { data: insertedData, error } = await supabase
        .from("books")
        .insert([{
          id: newBook.id,
          barcode: newBook.barcode,
          name: newBook.name,
          author: newBook.author,
          category: newBook.category,
          printinginstitute: newBook.printingInstitute,
          originalprice: newBook.originalPrice,
          saleprice: newBook.salePrice,
          quantity: newBook.quantity,
          stallid: newBook.stallId,
          createdat: newBook.createdAt.toISOString(),
          updatedat: newBook.updatedAt.toISOString(),
        }])
        .select();
      
      if (error) {
        console.error("Error adding book to Supabase:", error);
        toast({
          title: "Error",
          description: "Error saving book to database. Saved locally only.",
          variant: "destructive",
        });
        
        // Fallback to local storage
        const books = getBooks();
        setBooks([...books, newBook]);
      } else {
        console.log("Book added to Supabase successfully:", insertedData);
        
        // Also update local storage to maintain data consistency
        const books = getBooks();
        setBooks([...books, newBook]);
        
        toast({
          title: "Success",
          description: "Book added successfully!",
          variant: "default",
        });
        
        form.reset();
        navigate("/books");
      }
    } catch (supabaseError) {
      console.error("Exception when adding book to Supabase:", supabaseError);
      
      // Create the book object again in the catch block to make it available
      const errorBook: Book = {
        id: crypto.randomUUID(),
        barcode: data.barcode,
        name: data.name,
        author: data.author,
        category: data.category || "",
        printingInstitute: data.printingInstitute || "",
        originalPrice: data.originalPrice,
        salePrice: data.salePrice,
        quantity: data.quantity,
        stallId: currentStore,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Fallback to local storage
      const books = getBooks();
      setBooks([...books, errorBook]);
      
      toast({
        title: t("common.warning"),
        description: t("common.savedLocallyOnly"),
        variant: "default",
      });
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader title={t("common.addBook")} showBackButton={true} backTo="/books" />
      
      <div className="mobile-container">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.bookName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("common.bookName")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.authorName")}</FormLabel>
                  <Select onValueChange={handleAuthorChange} defaultValue={form.getValues("author")}>
                    <FormControl>
                      <SelectTrigger className="temple-input">
                        <SelectValue placeholder={t("common.selectAuthor")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {authors.map(author => (
                        <SelectItem key={author} value={author}>{author}</SelectItem>
                      ))}
                      <SelectItem key="add-new" value="add-new">{t("common.addNew")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.category")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={form.getValues("category")}>
                    <FormControl>
                      <SelectTrigger className="temple-input">
                        <SelectValue placeholder={t("common.selectCategory")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                      <SelectItem key="add-new" value="add-new">{t("common.addNew")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="printingInstitute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.printingInstitute")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={form.getValues("printingInstitute")}>
                    <FormControl>
                      <SelectTrigger className="temple-input">
                        <SelectValue placeholder={t("common.selectInstitute")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {institutes.map(institute => (
                        <SelectItem key={institute} value={institute}>{institute}</SelectItem>
                      ))}
                      <SelectItem key="add-new" value="add-new">{t("common.addNew")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.quantity")}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="originalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.originalPrice")}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" value={originalPrice} onChange={handleOriginalPriceChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.salePrice")}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.barcode")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("common.barcode")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-temple-saffron hover:bg-temple-saffron/90"
              >
                {t("common.addBook")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AddBookPage;
