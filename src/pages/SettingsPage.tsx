
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStallContext } from "@/contexts/StallContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import MobileHeader from "@/components/MobileHeader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Store } from "lucide-react";

const SettingsPage: React.FC = () => {
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const { stores, currentStore, addStore } = useStallContext();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const { inviteUser, currentUser, isAdmin } = useAuth();
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "personnel">("personnel");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsAddStoreOpen(false);
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

  const handleInviteUser = async () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePhone.trim()) {
      toast({
        title: t("common.error"),
        description: t("common.fillRequiredFields"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const code = await inviteUser(inviteName, inviteEmail, invitePhone, inviteRole);
      setInviteCode(code);
      toast({
        title: t("common.success"),
        description: t("common.userInvitedSuccess"),
      });
    } catch (error) {
      console.error("Error inviting user:", error);
      toast({
        title: t("common.error"),
        description: t("common.userInviteFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppLink = (code: string) => {
    const signupUrl = `${window.location.origin}/complete-signup/${code}`;
    const message = `You've been invited to join Temple Book Sutra. Click this link to complete your registration: ${signupUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const copyInviteLink = (code: string) => {
    const signupUrl = `${window.location.origin}/complete-signup/${code}`;
    navigator.clipboard.writeText(signupUrl);
    toast({
      title: t("common.copied"),
      description: t("common.inviteLinkCopied"),
    });
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
        {isAdmin && (
          <div className="mb-6">
            <Button 
              onClick={handleManageMetadata} 
              className="w-full bg-temple-maroon hover:bg-temple-maroon/90 text-white"
            >
              {t("common.manageMetadata")}
            </Button>
          </div>
        )}
        
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
        {isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t("settings.storeManagement")}</CardTitle>
                <Dialog open={isAddStoreOpen} onOpenChange={setIsAddStoreOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-temple-saffron hover:bg-temple-saffron/90">
                      <Plus size={16} className="mr-1" /> {t("common.addStore")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("common.addNewStore")}</DialogTitle>
                      <DialogDescription>
                        {t("common.createNewStoreDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label htmlFor="stallName" className="text-sm font-medium">
                          {t("common.storeName")} *
                        </label>
                        <Input
                          id="stallName"
                          placeholder={t("common.storeNamePlaceholder")}
                          value={newStoreName}
                          onChange={(e) => setNewStoreName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="stallLocation" className="text-sm font-medium">
                          {t("common.storeLocation")} ({t("common.optional")})
                        </label>
                        <Input
                          id="stallLocation"
                          placeholder={t("common.storeLocationPlaceholder")}
                          value={newStoreLocation}
                          onChange={(e) => setNewStoreLocation(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddStoreOpen(false)}>
                        {t("common.cancel")}
                      </Button>
                      <Button 
                        className="bg-temple-saffron hover:bg-temple-saffron/90"
                        onClick={handleAddStore}
                        disabled={isAdding}
                      >
                        {isAdding ? t("common.adding") : t("common.addStore")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stores.length > 0 ? (
                  stores.map(store => (
                    <div key={store.id} className="p-3 border rounded bg-gray-50">
                      <div className="font-medium">{store.name}</div>
                      {store.location && <div className="text-sm text-gray-500">{store.location}</div>}
                      {currentStore === store.id && (
                        <div className="text-xs text-temple-saffron mt-1">{t("settings.currentStore")}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-temple-gold/40 rounded-lg">
                    <Store className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="text-gray-500 mt-2">{t("common.noStores")}</p>
                    <Button 
                      className="mt-3 bg-temple-saffron hover:bg-temple-saffron/90"
                      size="sm"
                      onClick={() => setIsAddStoreOpen(true)}
                    >
                      <Plus size={16} className="mr-1" /> {t("common.addFirstStore")}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invite users section */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t("common.personnel")}</CardTitle>
                <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-temple-maroon hover:bg-temple-maroon/90">
                      <Plus size={16} className="mr-1" /> {t("common.invite")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("common.inviteNewUser")}</DialogTitle>
                      <DialogDescription>
                        {t("common.sendInvitation")}
                      </DialogDescription>
                    </DialogHeader>
                    {!inviteCode ? (
                      <>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label htmlFor="inviteName" className="text-sm font-medium">
                              {t("common.name")} *
                            </label>
                            <Input
                              id="inviteName"
                              placeholder="John Doe"
                              value={inviteName}
                              onChange={(e) => setInviteName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="inviteEmail" className="text-sm font-medium">
                              {t("common.email")} *
                            </label>
                            <Input
                              id="inviteEmail"
                              type="email"
                              placeholder="john@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="invitePhone" className="text-sm font-medium">
                              {t("common.phoneNumber")} *
                            </label>
                            <Input
                              id="invitePhone"
                              placeholder="+91 9876543210"
                              value={invitePhone}
                              onChange={(e) => setInvitePhone(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="inviteRole" className="text-sm font-medium">
                              {t("common.role")} *
                            </label>
                            <select
                              id="inviteRole"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value as "admin" | "personnel")}
                            >
                              <option value="personnel">{t("common.personnel")}</option>
                              <option value="admin">{t("common.admin")}</option>
                            </select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsInviteUserOpen(false)}>
                            {t("common.cancel")}
                          </Button>
                          <Button 
                            className="bg-temple-maroon hover:bg-temple-maroon/90"
                            onClick={handleInviteUser}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? t("common.generatingInvite") : t("common.generateInvite")}
                          </Button>
                        </DialogFooter>
                      </>
                    ) : (
                      <>
                        <div className="space-y-4 py-4">
                          <div className="text-center">
                            <p className="font-medium text-temple-maroon">{t("common.inviteCreated")}</p>
                            <p className="text-sm mt-2">{t("common.shareLink", { name: inviteName })}</p>
                          </div>
                          <div className="p-3 bg-gray-100 rounded-md text-sm break-all">
                            {`${window.location.origin}/complete-signup/${inviteCode}`}
                          </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                          <Button
                            className="w-full justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                            variant="outline"
                            onClick={() => copyInviteLink(inviteCode)}
                          >
                            {t("common.copyLink")}
                          </Button>
                          <Button
                            className="w-full justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                            variant="outline"
                            onClick={() => window.open(generateWhatsAppLink(inviteCode), '_blank')}
                          >
                            {t("common.shareViaWhatsApp")}
                          </Button>
                          <Button
                            className="w-full justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                            variant="outline"
                            onClick={() => {
                              setInviteCode("");
                              setInviteName("");
                              setInviteEmail("");
                              setInvitePhone("");
                              setInviteRole("personnel");
                              setIsInviteUserOpen(false);
                            }}
                          >
                            {t("common.done")}
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  className="w-full justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                  variant="outline"
                  onClick={() => setIsInviteUserOpen(true)}
                >
                  <Users size={20} className="mr-2" /> {t("common.inviteNewPersonnel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
