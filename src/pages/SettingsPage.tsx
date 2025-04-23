import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStallContext } from "@/contexts/StallContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import MobileHeader from "@/components/MobileHeader";
import { useNavigate } from "react-router-dom";

const SettingsPage: React.FC = () => {
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const { stores, currentStore, addStore } = useStallContext();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const handleAddStore = async () => {
    if (!newStoreName.trim()) {
      toast({
        title: t("common.required"),
        description: t("common.storeName"),
        variant: "destructive",
      });
      return;
    }
    
    setIsAdding(true);
    
    try {
      console.log("Adding store:", newStoreName, newStoreLocation);
      const success = await addStore(newStoreName, newStoreLocation);
      
      if (success) {
        toast({
          title: t("common.success"),
          description: `${newStoreName} ${t("common.addedSuccessfully")}`,
        });
        setNewStoreName("");
        setNewStoreLocation("");
      }
    } catch (error) {
      console.error("Error adding store:", error);
      toast({
        title: t("common.error"),
        description: t("common.errorAddingStore"),
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setCurrentLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const handleManageMetadata = () => {
    navigate('/metadata-manager');
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("settings.settings")} 
        showBackButton={true} 
        backTo="/"
      />
      
      <div className="container mx-auto px-4 py-6">
        {/* Action Buttons */}
        <div className="mb-6">
          <Button 
            onClick={handleManageMetadata} 
            className="w-full bg-temple-maroon hover:bg-temple-maroon/90 text-white"
          >
            {t("common.manageMetadata")}
          </Button>
        </div>
        
        {/* Language selection section */}
        <Card className="mb-6">
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
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.storeManagement")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 mb-4">
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
                disabled={!newStoreName.trim() || isAdding} 
                className="bg-temple-saffron hover:bg-temple-saffron/90"
              >
                {isAdding ? t("common.adding") : t("common.addStore")}
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
      </div>
    </div>
  );
};

export default SettingsPage;
