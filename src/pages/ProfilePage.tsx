
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const ProfilePage: React.FC = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    
    setName(currentUser.name || "");
    setEmail(currentUser.email || "");
    setPhone(currentUser.phone || "");
    setRole(currentUser.role || "");
  }, [currentUser, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update user profile in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          name,
          phone
        })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      
      // Update local state
      updateUserProfile({
        ...currentUser,
        name,
        phone
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-temple-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-temple-maroon">
            {t("common.profile")}
          </h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-temple-maroon text-temple-maroon"
              onClick={() => navigate(-1)}
            >
              {t("common.back")}
            </Button>
            <Button 
              variant="outline" 
              className="border-temple-maroon text-temple-maroon"
              onClick={() => navigate("/")}
            >
              {t("common.home")}
            </Button>
          </div>
        </div>
        
        <Card className="temple-card">
          <CardHeader>
            <CardTitle>{t("common.profile")}</CardTitle>
            <CardDescription>{t("common.updateYourPersonalInformation")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("common.name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  {t("common.emailCannotBeChanged")}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">{t("common.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">{t("common.role")}</Label>
                <Input
                  id="role"
                  value={role}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  {t("common.roleCannotBeChanged")}
                </p>
              </div>
              
              <Button
                type="submit"
                className="bg-temple-saffron hover:bg-temple-gold text-white w-full md:w-auto"
                disabled={isLoading}
              >
                {isLoading ? t("common.updating") : t("common.updateProfile")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <Button
              variant="outline"
              className="border-temple-maroon text-temple-maroon"
              onClick={() => navigate("/settings")}
            >
              {t("common.settings")}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default ProfilePage;
