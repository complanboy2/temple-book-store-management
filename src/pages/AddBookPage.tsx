
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBooks, setBooks, generateId, getBookStalls } from "@/services/storageService";
import { Book } from "@/types";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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
    if (!name || !author || !category || !printingInstitute || !originalPrice || !salePrice || !quantity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
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
      
      <main className="container mx-auto px-4 py-6">
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
              
              <div className="space-y-2">
                <label htmlFor="author" className="text-lg font-medium">
                  Author*
                </label>
                <input
                  id="author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                  className="temple-input w-full"
                  placeholder="Enter author name"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="category" className="text-lg font-medium">
                  Category*
                </label>
                <input
                  id="category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="temple-input w-full"
                  placeholder="Enter category (e.g., Scripture, Epic)"
                />
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
