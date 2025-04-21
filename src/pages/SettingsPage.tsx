
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

const SettingsPage: React.FC = () => {
  const [authors, setLocalAuthors] = useState<string[]>([]);
  const [categories, setLocalCategories] = useState<string[]>([]);
  const [salePercent, setSalePercent] = useState<Record<string, number>>({});
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [saleInput, setSaleInput] = useState<{[k: string]: string}>({});

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

  return (
    <div className="min-h-screen bg-temple-background px-2 py-4">
      <h1 className="text-temple-maroon text-2xl font-bold mb-4">Settings</h1>
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
