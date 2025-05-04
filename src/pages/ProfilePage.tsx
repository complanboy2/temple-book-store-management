
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, User, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import MobileHeader from "@/components/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";

const ProfilePage: React.FC = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setName(currentUser.name || "");
    setEmail(currentUser.email || "");
    setPhone(currentUser.phone || "");
    setIsLoading(false);
  }, [currentUser, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setIsSaving(true);
    
    try {
      // Update user profile in the database
      const { error } = await supabase
        .from('users')
        .update({ 
          name: name,
          phone: phone
        })
        .eq('id', currentUser.id);
        
      if (error) throw error;
      
      // Update local state
      if (updateUserProfile) {
        updateUserProfile({
          ...currentUser,
          name,
          phone
        });
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      {isMobile ? (
        <MobileHeader
          title={t("common.profile")}
          showBackButton={true}
          backTo="/"
        />
      ) : (
        <div className="bg-gradient-to-r from-temple-saffron to-temple-gold py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold text-white">{t("common.profile")}</h1>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-temple-maroon" />
          </div>
        ) : (
          <>
            <Card className="max-w-lg mx-auto mb-6">
              <CardHeader>
                <CardTitle className="text-temple-maroon">{t("common.profileInformation")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("common.name")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        placeholder={t("common.enterYourName")}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("common.email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="pl-10 bg-muted/30"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{t("common.emailCannotBeChanged")}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("common.phoneNumber")}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        placeholder={t("common.enterYourPhone")}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-temple-maroon hover:bg-temple-maroon/90" 
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t("common.saving")}...
                        </>
                      ) : (
                        t("common.saveChanges")
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <Card className="max-w-lg mx-auto">
              <CardHeader>
                <CardTitle className="text-temple-maroon">{t("common.accountInformation")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{t("common.role")}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentUser?.role === "admin" ? t("common.administrator") : 
                         currentUser?.role === "super_admin" ? t("common.superAdmin") : 
                         t("common.personnel")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-medium">{t("common.permissions")}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentUser?.canSell && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            {t("common.canSell")}
                          </span>
                        )}
                        {currentUser?.canRestock && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {t("common.canRestock")}
                          </span>
                        )}
                        {currentUser?.role === "admin" && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            {t("common.canManageUsers")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
