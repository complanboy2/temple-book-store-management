import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBooks, setBooks, generateId, getBookStalls } from "@/services/storageService";
import { Book } from "@/types";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { getAuthors, setAuthors, getCategories, setCategories } from "@/services/storageService";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  // New state and logic for authors and categories
  const [authors, setLocalAuthors] = useState<string[]>([]);
  const [categories, setLocalCategories] = useState<string[]>([]);
  const [customAuthor, setCustomAuthor] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => {
    setLocalAuthors(getAuthors());
    setLocalCategories(getCategories());
  }, []);

  const addAuthor = () => {
    if (customAuthor.trim() && !authors.includes(customAuthor.trim())) {
      const next = [...authors, customAuthor.trim()];
      setAuthors(next);
      setLocalAuthors(next);
      setAuthor(customAuthor.trim());
      setCustomAuthor("");
    }
  };

  const deleteAuthor = (name: string) => {
    const next = authors.filter(a => a !== name);
    setAuthors(next);
    setLocalAuthors(next);
    if (author === name) setAuthor("");
  };

  const addCategory = () => {
    if (customCategory.trim() && !categories.includes(customCategory.trim())) {
      const next = [...categories, customCategory.trim()];
      setCategories(next);
      setLocalCategories(next);
      setCategory(customCategory.trim());
      setCustomCategory("");
    }
  };

  const deleteCategory = (name: string) => {
    const next = categories.filter(c => c !== name);
    setCategories(next);
    setLocalCategories(next);
    if (category === name) setCategory("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const bookStalls = getBookStalls();
      const stallId = bookStalls.length > 0 ? bookStalls[0].id : "stall-1";
      
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
        stallId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const books = getBooks();
      setBooks([...books, newBook]);
      
      toast({
        title: "Book Added",
        description: `"${name}" has been added to the inventory.`,
      });
      
      navigate("/books");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add the book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!name || !author || !printingInstitute || !originalPrice || !salePrice || !quantity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Book Name, Author, Printing Institute, Prices, Quantity).",
        variant: "destructive",
      });
      return false;
    }
    if (isNaN(parseFloat(originalPrice)) || isNaN(parseFloat(salePrice)) || isNaN(parseInt(quantity))) {
      toast({
        title: "Validation Error",
        description: "Price and quantity must be valid numbers.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-temple-background">
      <Header />
      
      <main className="container mx-auto px-2 py-2">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          ← Back
        </Button>
        
        <Card className="temple-card max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-temple-maroon">Add New Book</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-lg font-medium">
                  Book Name*
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="temple-input w-full"
                  placeholder="Enter book name"
                />
              </div>
              
            {/* --- AUTHOR FIELD --- */}
            <div className="space-y-2">
              <label className="text-lg font-medium">
                Author*
              </label>
              <div className="flex gap-2">
                <Select
                  value={author}
                  onValueChange={val => setAuthor(val)}
                  defaultValue=""
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select author..." />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map(a => (
                      <div key={a} className="flex items-center justify-between">
                        <SelectItem value={a}>{a}</SelectItem>
                        <button type="button" className="ml-2 text-destructive" onClick={() => deleteAuthor(a)}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  className="temple-input flex-1"
                  value={customAuthor}
                  placeholder="Add new author"
                  onChange={e => setCustomAuthor(e.target.value)}
                />
                <button type="button" onClick={addAuthor} className={cn("bg-temple-maroon text-white rounded px-2", !customAuthor && "opacity-40")} disabled={!customAuthor}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* --- CATEGORY FIELD --- */}
            <div className="space-y-2">
              <label className="text-lg font-medium">
                Category{" "}
                <span className="text-[12px] text-gray-400">(optional)</span>
              </label>
              <div className="flex gap-2">
                <Select
                  value={category}
                  onValueChange={val => setCategory(val)}
                  defaultValue=""
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <div key={c} className="flex items-center justify-between">
                        <SelectItem value={c}>{c}</SelectItem>
                        <button type="button" className="ml-2 text-destructive" onClick={() => deleteCategory(c)}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  className="temple-input flex-1"
                  value={customCategory}
                  placeholder="Add new category"
                  onChange={e => setCustomCategory(e.target.value)}
                />
                <button type="button" onClick={addCategory} className={cn("bg-temple-maroon text-white rounded px-2", !customCategory && "opacity-40")} disabled={!customCategory}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

              
              <div className="space-y-2">
                <label htmlFor="printingInstitute" className="text-lg font-medium">
                  Printing Institute*
                </label>
                <input
                  id="printingInstitute"
                  type="text"
                  value={printingInstitute}
                  onChange={(e) => setPrintingInstitute(e.target.value)}
                  required
                  className="temple-input w-full"
                  placeholder="Enter printing institute"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="originalPrice" className="text-lg font-medium">
                    Original Price (₹)*
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
                    Sale Price (₹)*
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
                  Quantity*
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="temple-input w-full"
                  placeholder="Enter quantity"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="barcode" className="text-lg font-medium">
                  Barcode/QR Code (Optional)
                </label>
                <input
                  id="barcode"
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="temple-input w-full"
                  placeholder="Enter barcode or QR code"
                />
              </div>
              
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="temple-button w-full"
                >
                  {isLoading ? "Adding Book..." : "Add Book to Inventory"}
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
