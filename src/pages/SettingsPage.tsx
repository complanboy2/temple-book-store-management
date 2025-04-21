
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getAuthors,
  setAuthors,
  getCategories,
  setCategories,
  getAuthorSalePercentage,
  setAuthorSalePercentage
} from "@/services/storageService";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useStallContext } from "@/contexts/StallContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const SettingsPage: React.FC = () => {
  const [authors, setLocalAuthors] = useState<string[]>([]);
  const [categories, setLocalCategories] = useState<string[]>([]);
  const [salePercent, setSalePercent] = useState<Record<string, number>>({});
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [saleInput, setSaleInput] = useState<{[k: string]: string}>({});
  const { stores, currentStore, addStore } = useStallContext();
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setLocalAuthors(getAuthors());
    setLocalCategories(getCategories());
    setSalePercent(getAuthorSalePercentage() || {});
  }, []);

  const handleAddAuthor = () => {
    if (newAuthor.trim() && !authors.includes(newAuthor.trim())) {
      const next = [...authors, newAuthor.trim()];
      setAuthors(next);
      setLocalAuthors(next);
      setNewAuthor("");
    }
  };

  const handleDeleteAuthor = (name: string) => {
    setLocalAuthors(authors.filter(a => a !== name));
    setAuthors(authors.filter(a => a !== name));
    const next = {...salePercent};
    delete next[name];
    setSalePercent(next);
    setAuthorSalePercentage(next);
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const next = [...categories, newCategory.trim()];
      setCategories(next);
      setLocalCategories(next);
      setNewCategory("");
    }
  };

  const handleDeleteCategory = (cat: string) => {
    setLocalCategories(categories.filter(c => c !== cat));
    setCategories(categories.filter(c => c !== cat));
  };

  const handleSaleChange = (author: string, value: string) => {
    setSaleInput({ ...saleInput, [author]: value });
  };

  const handleSaveSale = (author: string) => {
    const percent = Number(saleInput[author]);
    if (!isNaN(percent) && percent >= 0) {
      const next = {...salePercent, [author]: percent};
      setSalePercent(next);
      setAuthorSalePercentage(next);
    }
    setSaleInput({ ...saleInput, [author]: "" });
  };

  const handleAddStore = async () => {
    if (!newStoreName.trim()) {
      toast({
        title: "Store name required",
        description: "Please enter a name for the store",
        variant: "destructive",
      });
      return;
    }
    
    const result = await addStore(newStoreName, newStoreLocation);
    if (result) {
      toast({
        title: "Store Added",
        description: `${newStoreName} has been added successfully`,
      });
      setNewStoreName("");
      setNewStoreLocation("");
    }
  };

  return (
    <div className="min-h-screen bg-temple-background px-2 py-4">
      <h1 className="text-temple-maroon text-2xl font-bold mb-4">Settings</h1>
      
      {/* Stores section */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Book Stores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 mb-2">
            <Input 
              value={newStoreName} 
              onChange={e => setNewStoreName(e.target.value)} 
              placeholder="Store name" 
              className="mb-1"
            />
            <Input 
              value={newStoreLocation} 
              onChange={e => setNewStoreLocation(e.target.value)} 
              placeholder="Store location (optional)" 
              className="mb-1"
            />
            <Button 
              onClick={handleAddStore} 
              disabled={!newStoreName.trim()} 
              className="bg-temple-saffron hover:bg-temple-saffron/90"
            >
              Add Store
            </Button>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Current Stores:</h3>
            {stores.length > 0 ? (
              <div className="space-y-2">
                {stores.map(store => (
                  <div key={store.id} className="p-3 border rounded bg-gray-50">
                    <div className="font-medium">{store.name}</div>
                    {store.location && <div className="text-sm text-gray-500">{store.location}</div>}
                    {currentStore === store.id && (
                      <div className="text-xs text-temple-saffron mt-1">Current Store</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No stores added yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Author section */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Authors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-2">
            <Input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} placeholder="Add new author" />
            <Button onClick={handleAddAuthor} disabled={!newAuthor} >Add</Button>
          </div>
          <div className="flex flex-col gap-2">
            {authors.map(a =>
              <div key={a} className="flex gap-2 items-center">
                <span className="flex-1">{a}</span>
                <Input
                  className="max-w-[80px]"
                  type="number"
                  min={0}
                  value={saleInput[a] ?? salePercent[a] ?? ""}
                  onChange={e => handleSaleChange(a, e.target.value)}
                  placeholder="%"
                />
                <Button size="sm" onClick={() => handleSaveSale(a)}>Save %</Button>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteAuthor(a)}><X className="w-4 h-4" /></Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Category section */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-2">
            <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Add new category" />
            <Button onClick={handleAddCategory} disabled={!newCategory}>Add</Button>
          </div>
          <div className="flex flex-col gap-2">
            {categories.map(c =>
              <div key={c} className="flex gap-2 items-center">
                <span className="flex-1">{c}</span>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(c)}><X className="w-4 h-4" /></Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Explain for admin */}
      <div className="mt-6 text-[13px] text-temple-maroon/60">
        Tip: Sale percentage is added on top of book's original price per author. Leave blank for no default.
      </div>
    </div>
  );
};

export default SettingsPage;
