
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import MobileHeader from "@/components/MobileHeader";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { User } from "@/types";

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  phone: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
    },
  });
  
  const onSubmit = async (values: ProfileValues) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Make sure we preserve all required User properties
      const updatedUser: User = {
        ...currentUser,
        name: values.name,
        email: values.email,
        phone: values.phone || "",
      };
      
      await updateUserProfile(updatedUser);
      
      toast({
        title: t("common.success"),
        description: t("profile.profileUpdated"),
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: t("common.error"),
        description: t("profile.updateFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{t("common.loading")}</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("profile.title")} 
        showBackButton={true}
        backTo="/"
      />
      
      <main className="container mx-auto px-4 py-6">
        <Card className="temple-card">
          <CardHeader>
            <CardTitle className="text-lg text-temple-maroon">{t("profile.myProfile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.name")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.enterName")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.email")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.enterEmail")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.phone")} ({t("common.optional")})</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.enterPhone")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? t("common.saving") : t("common.saveChanges")}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate("/")}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProfilePage;
