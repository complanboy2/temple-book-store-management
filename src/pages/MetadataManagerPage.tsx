
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getAuthors, 
  setAuthors, 
  getCategories, 
  setCategories, 
  getPrintingInstitutes,
  setPrintingInstitutes,
  getAuthorSalePercentage,
  setAuthorSalePercentage
} from "@/services/storageService";
import { X, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import MobileHeader from "@/components/MobileHeader";
import { useTranslation } from "react-i18next";

const MetadataManagerPage: React.FC = () => {
  const [authors, setLocalAuthors] = useState<string[]>([]);
  const [categories, setLocalCategories] = useState<string[]>([]);
  const [printingInstitutes, setLocalPrintingInstitutes] = useState<string[]>([]);
  const [salePercent, setSalePercent] = useState<Record<string, number>>({});
  
  const [newAuthor, setNewAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newInstitute, setNewInstitute] = useState("");
  const [saleInput, setSaleInput] = useState<{[k: string]: string}>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    setLocalAuthors(getAuthors());
    setLocalCategories(getCategories());
    setLocalPrintingInstitutes(getPrintingInstitutes() || []);
    setSalePercent(getAuthorSalePercentage() || {});
  }, []);

  const handleAddAuthor = () => {
    if (newAuthor.trim() && !authors.includes(newAuthor.trim())) {
      const next = [...authors, newAuthor.trim()];
      setAuthors(next);
      setLocalAuthors(next);
      setNewAuthor("");
      toast({
        title: t("common.success"),
        description: t("common.authorAdded"),
      });
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
      toast({
        title: t("common.success"),
        description: t("common.categoryAdded"),
      });
    }
  };

  const handleDeleteCategory = (cat: string) => {
    setLocalCategories(categories.filter(c => c !== cat));
    setCategories(categories.filter(c => c !== cat));
  };

  const handleAddInstitute = () => {
    if (newInstitute.trim() && !printingInstitutes.includes(newInstitute.trim())) {
      const next = [...printingInstitutes, newInstitute.trim()];
      setPrintingInstitutes(next);
      setLocalPrintingInstitutes(next);
      setNewInstitute("");
      toast({
        title: t("common.success"),
        description: t("common.instituteAdded"),
      });
    }
  };

  const handleDeleteInstitute = (inst: string) => {
    setLocalPrintingInstitutes(printingInstitutes.filter(i => i !== inst));
    setPrintingInstitutes(printingInstitutes.filter(i => i !== inst));
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
      toast({
        title: t("common.success"),
        description: t("common.percentageSaved"),
      });
    }
    setSaleInput({ ...saleInput, [author]: "" });
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.metadataManager")} 
        showBackButton={true} 
        backTo="/settings"
      />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="authors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="authors">{t("common.authors")}</TabsTrigger>
            <TabsTrigger value="categories">{t("common.categories")}</TabsTrigger>
            <TabsTrigger value="institutes">{t("common.printingInstitutes")}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="authors">
            <Card>
              <CardHeader>
                <CardTitle>{t("common.manageAuthors")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input 
                    value={newAuthor} 
                    onChange={e => setNewAuthor(e.target.value)} 
                    placeholder={t("common.enterAuthorName")} 
                  />
                  <Button onClick={handleAddAuthor} disabled={!newAuthor.trim()}>
                    {t("common.add")}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {authors.map(a => (
                    <div key={a} className="flex gap-2 items-center p-2 border rounded bg-background">
                      <span className="flex-1 font-medium">{a}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          className="w-20"
                          type="number"
                          min={0}
                          value={saleInput[a] ?? salePercent[a] ?? ""}
                          onChange={e => handleSaleChange(a, e.target.value)}
                          placeholder="%"
                        />
                        <Button size="sm" onClick={() => handleSaveSale(a)}>
                          {t("common.save")}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteAuthor(a)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {authors.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      {t("common.noAuthors")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>{t("common.manageCategories")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input 
                    value={newCategory} 
                    onChange={e => setNewCategory(e.target.value)} 
                    placeholder={t("common.enterCategoryName")} 
                  />
                  <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
                    {t("common.add")}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {categories.map(c => (
                    <div key={c} className="flex gap-2 items-center p-2 border rounded bg-background">
                      <span className="flex-1 font-medium">{c}</span>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(c)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {categories.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      {t("common.noCategories")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="institutes">
            <Card>
              <CardHeader>
                <CardTitle>{t("common.managePrintingInstitutes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input 
                    value={newInstitute} 
                    onChange={e => setNewInstitute(e.target.value)} 
                    placeholder={t("common.enterInstituteName")} 
                  />
                  <Button onClick={handleAddInstitute} disabled={!newInstitute.trim()}>
                    {t("common.add")}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {printingInstitutes.map(i => (
                    <div key={i} className="flex gap-2 items-center p-2 border rounded bg-background">
                      <span className="flex-1 font-medium">{i}</span>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteInstitute(i)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {printingInstitutes.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      {t("common.noInstitutes")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MetadataManagerPage;
