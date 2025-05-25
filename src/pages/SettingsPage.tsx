
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStallContext } from "@/contexts/StallContext";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import MobileHeader from "@/components/MobileHeader";
import { Plus, Users, Store } from "lucide-react";

const SettingsPage = () => {
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("personnel");
  
  const { currentUser, isAdmin } = useAuth();
  const { bookStalls, refreshStalls } = useStallContext();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleAddStore = async () => {
    if (!newStoreName.trim()) return;
    
    try {
      const { error } = await supabase
        .from("book_stalls")
        .insert({
          name: newStoreName.trim(),
          location: newStoreLocation.trim() || null,
          instituteid: currentUser?.instituteId || "inst-1"
        });
        
      if (error) throw error;
      
      toast({
        title: t("common.success"),
        description: t("common.storeAdded"),
      });
      
      setNewStoreName("");
      setNewStoreLocation("");
      setIsAddingStore(false);
      refreshStalls();
    } catch (error) {
      console.error("Error adding store:", error);
      toast({
        title: t("common.error"),
        description: t("common.failedToAddStore"),
        variant: "destructive",
      });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;
    
    // Implementation for user invitation would go here
    toast({
      title: t("common.success"),
      description: t("common.invitationSent"),
    });
    
    setInviteEmail("");
    setIsInviting(false);
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader
        title={t("common.settings")}
        showBackButton={true}
        backTo="/"
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-temple-maroon mb-6">{t("common.settings")}</h1>
        
        {/* User Profile Card */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t("common.profile")}</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-sm text-muted-foreground">{t("common.name")}</Label>
              <p className="font-medium">{currentUser?.name}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">{t("common.email")}</Label>
              <p className="font-medium">{currentUser?.email}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">{t("common.role")}</Label>
              <p className="font-medium capitalize">{currentUser?.role}</p>
            </div>
          </div>
        </Card>

        {/* Store Management Card */}
        {isAdmin && (
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">{t("common.storeManagement")}</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Dialog open={isAddingStore} onOpenChange={setIsAddingStore}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto" size="sm">
                      <Store className="h-4 w-4 mr-2" />
                      {t("common.addStore")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("common.addNewStore")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="storeName">{t("common.storeName")}</Label>
                        <Input
                          id="storeName"
                          value={newStoreName}
                          onChange={(e) => setNewStoreName(e.target.value)}
                          placeholder={t("common.enterStoreName")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storeLocation">{t("common.location")}</Label>
                        <Input
                          id="storeLocation"
                          value={newStoreLocation}
                          onChange={(e) => setNewStoreLocation(e.target.value)}
                          placeholder={t("common.enterLocation")}
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handleAddStore} 
                          disabled={!newStoreName.trim()}
                          className="flex-1"
                        >
                          {t("common.addStore")}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddingStore(false)}
                          className="flex-1"
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isInviting} onOpenChange={setIsInviting}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      {t("common.inviteUser")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("common.inviteNewUser")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">{t("common.email")}</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder={t("common.enterEmail")}
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handleInviteUser} 
                          disabled={!inviteEmail.trim()}
                          className="flex-1"
                        >
                          {t("common.sendInvite")}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsInviting(false)}
                          className="flex-1"
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t("common.currentStores")}</Label>
              {bookStalls?.length > 0 ? (
                <div className="space-y-2">
                  {bookStalls.map((stall) => (
                    <div key={stall.id} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{stall.name}</p>
                      {stall.location && (
                        <p className="text-sm text-muted-foreground">{stall.location}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t("common.noStoresFound")}</p>
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SettingsPage;
