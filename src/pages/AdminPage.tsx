
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, BookOpen, BarChart2, Settings, MessageSquare } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useStallContext } from "@/contexts/StallContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";

// Import the WhatsApp icon from lucide-react
import { Smartphone } from "lucide-react";

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, inviteUser, currentUser } = useAuth();
  const { stores, addStore, currentStore } = useStallContext();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isAddStallOpen, setIsAddStallOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [newStallName, setNewStallName] = useState("");
  const [newStallLocation, setNewStallLocation] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "personnel">("personnel");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appVersion, setAppVersion] = useState("1.0.0"); // Default app version

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
    
    // Get app version from package.json or environment
    // Since we can't directly access package.json, we'll use this placeholder
    setAppVersion("1.0.0");
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  const handleAddStall = async () => {
    if (!newStallName.trim()) {
      toast({
        title: t("common.error"),
        description: t("common.stallNameRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addStore(newStallName, newStallLocation);
      toast({
        title: t("common.success"),
        description: t("common.stallAddedSuccess"),
      });
      setNewStallName("");
      setNewStallLocation("");
      setIsAddStallOpen(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.stallAddFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

  // Create WhatsApp contact us link
  const generateContactUsWhatsAppLink = () => {
    // The phone number provided in the requirements
    const phoneNumber = "919100091000";
    
    // Create message with app details
    const message = `Hello, I'm using Book Store Manager app v${appVersion}.${
      currentUser ? ` My name is ${currentUser.name}.` : ''
    }${
      currentStore ? ` I'm managing the store: ${stores.find(s => s.id === currentStore)?.name}.` : ''
    } I need assistance with: `;
    
    // Generate WhatsApp URL
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <Header />
      <MobileHeader title={t("common.administration")} showBackButton={true} />

      <div className="mobile-container">
        <div className="grid grid-cols-1 gap-4 mt-4">
          {/* Stalls section */}
          <div className="mobile-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="mobile-header">{t("common.stores")}</h2>
              <Dialog open={isAddStallOpen} onOpenChange={setIsAddStallOpen}>
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
                        value={newStallName}
                        onChange={(e) => setNewStallName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="stallLocation" className="text-sm font-medium">
                        {t("common.storeLocation")} ({t("common.optional")})
                      </label>
                      <Input
                        id="stallLocation"
                        placeholder={t("common.storeLocationPlaceholder")}
                        value={newStallLocation}
                        onChange={(e) => setNewStallLocation(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddStallOpen(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button 
                      className="bg-temple-saffron hover:bg-temple-saffron/90"
                      onClick={handleAddStall}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t("common.adding") : t("common.addStore")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {stores.length > 0 ? (
              <div className="space-y-3">
                {stores.map((store) => (
                  <div key={store.id} className="border border-temple-gold/20 rounded-lg p-3 bg-white shadow-sm">
                    <h3 className="font-medium text-temple-maroon">{store.name}</h3>
                    {store.location && <p className="text-sm text-gray-600">{store.location}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-temple-gold/40 rounded-lg">
                <p className="text-gray-500">{t("common.noStores")}</p>
                <Button 
                  className="mt-2 bg-temple-saffron hover:bg-temple-saffron/90"
                  size="sm"
                  onClick={() => setIsAddStallOpen(true)}
                >
                  <Plus size={16} className="mr-1" /> {t("common.addFirstStore")}
                </Button>
              </div>
            )}
          </div>

          {/* Invite users section */}
          <div className="mobile-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="mobile-header">{t("common.inviteUsers")}</h2>
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
                            className="stall-selector w-full"
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

            <div className="space-y-4">
              <Button
                className="w-full justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                variant="outline"
                onClick={() => setIsInviteUserOpen(true)}
              >
                <Users size={20} className="mr-2" /> {t("common.inviteNewPersonnel")}
              </Button>
            </div>
          </div>

          {/* Quick links section */}
          <div className="mobile-card">
            <h2 className="mobile-header mb-4">{t("common.adminActions")}</h2>
            <div className="grid grid-cols-1 gap-3">
              <Button
                className="justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                variant="outline"
                onClick={() => navigate("/reports")}
              >
                <BarChart2 size={20} className="mr-2" /> {t("common.salesReports")}
              </Button>
              <Button
                className="justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                variant="outline"
                onClick={() => navigate("/books")}
              >
                <BookOpen size={20} className="mr-2" /> {t("common.manageInventory")}
              </Button>
              <Button
                className="justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                variant="outline"
                onClick={() => navigate("/settings")}
              >
                <Settings size={20} className="mr-2" /> {t("common.appSettings")}
              </Button>
              
              {/* Contact Us via WhatsApp Button */}
              <Button
                className="justify-start shadow-sm bg-temple-background hover:bg-temple-gold/10 text-temple-maroon"
                variant="outline"
                onClick={() => window.open(generateContactUsWhatsAppLink(), '_blank')}
              >
                <Smartphone size={20} className="mr-2" /> {t("common.contactUs")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
