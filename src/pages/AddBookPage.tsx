
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
  getAuthorSalePercentage,
  setCategories,
  setAuthors,
  setPrintingInstitutes
} from "@/services/storageService";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [authors, setAuthorsState] = useState<string[]>([]);
  const [categories, setCategoriesState] = useState<string[]>([]);
  const [institutes, setInstitutesState] = useState<string[]>([]);
  const [authorPercentages, setAuthorPercentages] = useState<Record<string, number>>({});
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  const [newAuthor, setNewAuthor] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [newInstitute, setNewInstitute] = useState<string>("");
  const [showAuthorInput, setShowAuthorInput] = useState<boolean>(false);
  const [showCategoryInput, setShowCategoryInput] = useState<boolean>(false);
  const [showInstituteInput, setShowInstituteInput] = useState<boolean>(false);
  const { currentStore } = useStallContext();
  const isMobile = useIsMobile();

  // Load data
  useEffect(() => {
    const loadInitialData = async () => {
      // Try to fetch categories from Supabase
      try {
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("category, author, printinginstitute")
          .not("category", "is", null);
          
        if (!booksError && booksData) {
          // Extract unique categories
          const uniqueCategories = Array.from(new Set(
            booksData.map(b => b.category).filter(Boolean)
          )).sort() as string[];
          
          // Extract unique authors
          const uniqueAuthors = Array.from(new Set(
            booksData.map(b => b.author).filter(Boolean)
          )).sort() as string[];
          
          // Extract unique printing institutes
          const uniquePrintingInstitutes = Array.from(new Set(
            booksData.map(b => b.printinginstitute).filter(Boolean)
          )).sort() as string[];
          
          console.log("Loaded from Supabase:", { 
            categories: uniqueCategories,
            authors: uniqueAuthors,
            institutes: uniquePrintingInstitutes
          });
          
          // Update state with Supabase data, falling back to local storage
          setCategoriesState(uniqueCategories.length ? uniqueCategories : getCategories());
          setAuthorsState(uniqueAuthors.length ? uniqueAuthors : getAuthors());
          setInstitutesState(uniquePrintingInstitutes.length ? uniquePrintingInstitutes : getPrintingInstitutes());
          
          // Also update local storage for offline use
          if (uniqueCategories.length) setCategories(uniqueCategories);
          if (uniqueAuthors.length) setAuthors(uniqueAuthors);
          if (uniquePrintingInstitutes.length) setPrintingInstitutes(uniquePrintingInstitutes);
        } else {
          // Fall back to local storage
          setCategoriesState(getCategories());
          setAuthorsState(getAuthors());
          setInstitutesState(getPrintingInstitutes());
        }
      } catch (error) {
        console.error("Error loading metadata from Supabase:", error);
        // Fall back to local storage
        setCategoriesState(getCategories());
        setAuthorsState(getAuthors());
        setInstitutesState(getPrintingInstitutes());
      }
    
      // Load author percentages
      const percentages = getAuthorSalePercentage();
      console.log("Loaded author percentages:", percentages);
      setAuthorPercentages(percentages);
    };
    
    loadInitialData();
  }, []);

  // Calculate sale price based on original price and author percentage
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
    if (value === "add-new") {
      setShowAuthorInput(true);
      return;
    }
    
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

  const handleCategoryChange = (value: string) => {
    if (value === "add-new") {
      setShowCategoryInput(true);
      return;
    }
    
    form.setValue("category", value);
  };

  const handleInstituteChange = (value: string) => {
    if (value === "add-new") {
      setShowInstituteInput(true);
      return;
    }
    
    form.setValue("printingInstitute", value);
  };

  const handleAddNewAuthor = () => {
    if (newAuthor.trim()) {
      const updatedAuthors = [...authors, newAuthor];
      setAuthorsState(updatedAuthors);
      setAuthors(updatedAuthors);
      setAuthor(newAuthor);
      form.setValue("author", newAuthor);
      setNewAuthor("");
      setShowAuthorInput(false);
    }
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const updatedCategories = [...categories, newCategory];
      setCategoriesState(updatedCategories);
      setCategories(updatedCategories);
      form.setValue("category", newCategory);
      setNewCategory("");
      setShowCategoryInput(false);
    }
  };

  const handleAddNewInstitute = () => {
    if (newInstitute.trim()) {
      const updatedInstitutes = [...institutes, newInstitute];
      setInstitutesState(updatedInstitutes);
      setPrintingInstitutes(updatedInstitutes);
      form.setValue("printingInstitute", newInstitute);
      setNewInstitute("");
      setShowInstituteInput(false);
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
      
      <div className={`container mx-auto px-4 py-6 ${isMobile ? 'max-w-md' : ''}`}>
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
                  {!showAuthorInput ? (
                    <Select onValueChange={handleAuthorChange} value={field.value}>
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
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        placeholder={t("common.newAuthor")}
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddNewAuthor}>Add</Button>
                    </div>
                  )}
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
                  {!showCategoryInput ? (
                    <Select onValueChange={handleCategoryChange} value={field.value}>
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
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        placeholder={t("common.newCategory")}
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddNewCategory}>Add</Button>
                    </div>
                  )}
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
                  {!showInstituteInput ? (
                    <Select onValueChange={handleInstituteChange} value={field.value}>
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
                  ) : (
                    <div className="flex gap-2">
                      <Input 
                        placeholder={t("common.newInstitute")}
                        value={newInstitute}
                        onChange={(e) => setNewInstitute(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddNewInstitute}>Add</Button>
                    </div>
                  )}
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
                    <Input type="number" min="1" placeholder="1" {...field} />
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
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00" 
                      value={originalPrice} 
                      onChange={handleOriginalPriceChange} 
                    />
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
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="0.00" 
                      {...field}
                      value={field.value || ''} 
                    />
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
