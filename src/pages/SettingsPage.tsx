
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
import { useTranslation } from "react-i18next";
import MobileHeader from "@/components/MobileHeader";

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
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    setLocalAuthors(getAuthors());
    setLocalCategories(getCategories());
    setSalePercent(getAuthorSalePercentage() || {});
    setCurrentLanguage(i18n.language);
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
        title: t("common.required"),
        description: t("common.storeName"),
        variant: "destructive",
      });
      return;
    }
    
    const result = await addStore(newStoreName, newStoreLocation);
    if (result) {
      toast({
        title: t("common.store") + " " + t("common.addStore"),
        description: `${newStoreName} ${t("common.addStore")}`,
      });
      setNewStoreName("");
      setNewStoreLocation("");
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <div className="min-h-screen bg-temple-background">
      <MobileHeader title={t("settings.settings")} showBackButton={true} />
      <div className="px-2 py-4 mb-20">
        {/* Language selection section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("settings.language")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={currentLanguage === 'en' ? 'default' : 'outline'} 
                onClick={() => changeLanguage('en')}
                className={currentLanguage === 'en' ? 'bg-temple-saffron text-white' : ''}
              >
                {t("languages.english")}
              </Button>
              <Button 
                variant={currentLanguage === 'hi' ? 'default' : 'outline'} 
                onClick={() => changeLanguage('hi')}
                className={currentLanguage === 'hi' ? 'bg-temple-saffron text-white' : ''}
              >
                {t("languages.hindi")}
              </Button>
              <Button 
                variant={currentLanguage === 'te' ? 'default' : 'outline'} 
                onClick={() => changeLanguage('te')}
                className={currentLanguage === 'te' ? 'bg-temple-saffron text-white' : ''}
              >
                {t("languages.telugu")}
              </Button>
              <Button 
                variant={currentLanguage === 'ta' ? 'default' : 'outline'} 
                onClick={() => changeLanguage('ta')}
                className={currentLanguage === 'ta' ? 'bg-temple-saffron text-white' : ''}
              >
                {t("languages.tamil")}
              </Button>
              <Button 
                variant={currentLanguage === 'kn' ? 'default' : 'outline'} 
                onClick={() => changeLanguage('kn')}
                className={currentLanguage === 'kn' ? 'bg-temple-saffron text-white' : ''}
              >
                {t("languages.kannada")}
              </Button>
              <Button 
                variant={currentLanguage === 'mr' ? 'default' : 'outline'} 
                onClick={() => changeLanguage('mr')}
                className={currentLanguage === 'mr' ? 'bg-temple-saffron text-white' : ''}
              >
                {t("languages.marathi")}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Stores section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("settings.storeManagement")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 mb-2">
              <Input 
                value={newStoreName} 
                onChange={e => setNewStoreName(e.target.value)} 
                placeholder={t("common.storeName")} 
                className="mb-1"
              />
              <Input 
                value={newStoreLocation} 
                onChange={e => setNewStoreLocation(e.target.value)} 
                placeholder={t("common.storeLocation")} 
                className="mb-1"
              />
              <Button 
                onClick={handleAddStore} 
                disabled={!newStoreName.trim()} 
                className="bg-temple-saffron hover:bg-temple-saffron/90"
              >
                {t("common.addStore")}
              </Button>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">{t("settings.currentStore")}:</h3>
              {stores.length > 0 ? (
                <div className="space-y-2">
                  {stores.map(store => (
                    <div key={store.id} className="p-3 border rounded bg-gray-50">
                      <div className="font-medium">{store.name}</div>
                      {store.location && <div className="text-sm text-gray-500">{store.location}</div>}
                      {currentStore === store.id && (
                        <div className="text-xs text-temple-saffron mt-1">{t("settings.currentStore")}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t("common.stores")} {t("common.addStore")}</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Author section */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t("common.authors")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-2">
              <Input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} placeholder={t("common.addAuthor")} />
              <Button onClick={handleAddAuthor} disabled={!newAuthor}>{t("common.add")}</Button>
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
                  <Button size="sm" onClick={() => handleSaveSale(a)}>{t("common.save")} %</Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDeleteAuthor(a)}><X className="w-4 h-4" /></Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Category section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("common.categories")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-2">
              <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder={t("common.addCategory")} />
              <Button onClick={handleAddCategory} disabled={!newCategory}>{t("common.add")}</Button>
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
          {t("settings.tipSalePercentage")}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
