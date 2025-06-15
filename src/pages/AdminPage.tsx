
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Users, Plus } from "lucide-react";
import MobileHeader from "@/components/MobileHeader";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  canrestock: boolean;
  cansell: boolean;
  role?: string;
}

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserCanSell, setNewUserCanSell] = useState(false);
  const [newUserCanRestock, setNewUserCanRestock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const { currentStore } = useStallContext();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [currentStore, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-temple-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-bold text-red-600 mb-2">{t("admin.accessDenied")}</h2>
            <p className="text-gray-600">{t("admin.noPermission")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchUsers = async () => {
    if (!currentStore) return;

    try {
      setIsLoading(true);
      
      // Try to fetch users, but handle RLS errors gracefully
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('instituteid', currentStore);

      if (error) {
        console.error("Error fetching users:", error);
        
        // If we get an RLS error, show a helpful message instead of failing completely
        if (error.code === '42P17') {
          toast({
            title: t("admin.rlsError"),
            description: "Database access policies need to be updated. Please contact support.",
            variant: "destructive",
          });
          setUsers([]);
          return;
        }
        
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: t("common.error"),
        description: "Unable to load users due to permission restrictions.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addUser = async () => {
    if (!newUserName || !newUserEmail || !currentStore) {
      toast({
        title: t("common.error"),
        description: t("addBook.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingUser(true);
      
      const { error } = await supabase
        .from('users')
        .insert({
          name: newUserName,
          email: newUserEmail,
          phone: newUserPhone || null,
          canrestock: newUserCanRestock,
          cansell: newUserCanSell,
          instituteid: currentStore,
          role: 'personnel' as const
        });

      if (error) {
        if (error.code === '42P17') {
          toast({
            title: t("admin.rlsError"),
            description: "Unable to add user due to permission restrictions.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: t("common.success"),
        description: t("admin.userAddedSuccessfully"),
      });

      // Reset form
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPhone("");
      setNewUserCanSell(false);
      setNewUserCanRestock(false);

      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: t("common.error"),
        description: t("admin.failedToAddUser"),
        variant: "destructive",
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  const updateUserPermissions = async (userId: string, canSell: boolean, canRestock: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          cansell: canSell,
          canrestock: canRestock
        })
        .eq('id', userId);

      if (error) {
        if (error.code === '42P17') {
          toast({
            title: t("admin.rlsError"),
            description: "Unable to update permissions due to access restrictions.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: t("common.success"),
        description: t("admin.userPermissionsUpdated"),
      });

      // Update local state
      setUsers(users.map(user =>
        user.id === userId
          ? { ...user, cansell: canSell, canrestock: canRestock }
          : user
      ));
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: t("common.error"),
        description: t("admin.failedToUpdatePermissions"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("admin.users")}
        showBackButton={true}
        backTo="/"
      />
      
      <main className="container mx-auto px-3 py-4">
        {/* Add New User */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" />
              {t("admin.addNewUser")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">{t("common.name")}</Label>
              <Input
                id="name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder={t("common.name")}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder={t("common.email")}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">{t("common.phone")} ({t("common.optional")})</Label>
              <Input
                id="phone"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder={t("common.phone")}
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canSell"
                  checked={newUserCanSell}
                  onCheckedChange={(checked) => setNewUserCanSell(!!checked)}
                />
                <Label htmlFor="canSell" className="text-sm">{t("admin.canSell")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canRestock"
                  checked={newUserCanRestock}
                  onCheckedChange={(checked) => setNewUserCanRestock(!!checked)}
                />
                <Label htmlFor="canRestock" className="text-sm">{t("admin.canRestock")}</Label>
              </div>
            </div>

            <Button 
              onClick={addUser}
              className="w-full bg-temple-maroon hover:bg-temple-maroon/90"
              disabled={isAddingUser}
            >
              {isAddingUser ? t("admin.adding") : t("admin.addUser")}
            </Button>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              {t("admin.users")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">{t("common.loading")}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t("admin.noUsersFound")}
                <p className="text-sm mt-2">
                  If this is unexpected, there may be database permission issues that need to be resolved.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <Card key={user.id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium text-lg">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.phone && (
                            <p className="text-sm text-gray-600">{user.phone}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`sell-${user.id}`}
                              checked={user.cansell}
                              onCheckedChange={(checked) =>
                                updateUserPermissions(user.id, !!checked, user.canrestock)
                              }
                            />
                            <Label htmlFor={`sell-${user.id}`} className="text-sm">
                              {t("admin.canSell")}
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`restock-${user.id}`}
                              checked={user.canrestock}
                              onCheckedChange={(checked) =>
                                updateUserPermissions(user.id, user.cansell, !!checked)
                              }
                            />
                            <Label htmlFor={`restock-${user.id}`} className="text-sm">
                              {t("admin.canRestock")}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPage;
