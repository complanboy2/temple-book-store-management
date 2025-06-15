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

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserCanSell, setNewUserCanSell] = useState(false);
  const [newUserCanRestock, setNewUserCanRestock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [hasRlsError, setHasRlsError] = useState(false);
  const [dbError, setDbError] = useState(null);

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
      setHasRlsError(false);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('instituteid', currentStore);

      if (error) {
        console.error("Error fetching users:", error);
        
        if (error.code === '42P17' || error.message.includes('infinite recursion') || error.message.includes('policy')) {
          setHasRlsError(true);
          toast({
            title: "Database Access Issue",
            description: "There's a configuration issue with user access policies. The admin panel functionality is temporarily limited.",
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
      setHasRlsError(true);
      toast({
        title: t("common.error"),
        description: "Unable to load users. Please try again later or contact support if the issue persists.",
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
        if (error.code === '42P17' || error.message.includes('infinite recursion') || error.message.includes('policy')) {
          toast({
            title: "Database Access Issue",
            description: "Unable to add user due to database configuration. Please contact support.",
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
    if (hasRlsError) {
      toast({
        title: "Feature Temporarily Unavailable",
        description: "User permission updates are currently disabled due to database configuration issues.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          cansell: canSell,
          canrestock: canRestock
        })
        .eq('id', userId);

      if (error) {
        if (error.code === '42P17' || error.message.includes('infinite recursion') || error.message.includes('policy')) {
          toast({
            title: "Database Access Issue",
            description: "Unable to update permissions due to database configuration.",
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
    <div className="min-h-screen bg-temple-background">
      <MobileHeader title={t("admin.adminPanel")} showBackButton={true} />
      <div className="container mx-auto px-3 py-4">
        {dbError ? (
          <div className="bg-red-100 border border-red-300 rounded-lg p-6 mb-4">
            <h1 className="text-lg font-bold text-red-700 mb-2">{t("admin.databaseIssue") || "Database issue"}</h1>
            <p className="text-red-600">{t("admin.databaseContactSupport") || "The admin panel is currently experiencing database access issues. Some features may be temporarily unavailable. Please contact technical support if this persists."}</p>
            <pre className="mt-2 text-xs text-gray-600">{dbError?.message || dbError}</pre>
          </div>
        ) : (
          <main className="container mx-auto px-3 py-4">
            {hasRlsError && (
              <Card className="mb-4 border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-orange-600">⚠️</div>
                    <div>
                      <h3 className="font-medium text-orange-800">Limited Functionality</h3>
                      <p className="text-sm text-orange-700 mt-1">
                        The admin panel is currently experiencing database access issues. Some features may be temporarily unavailable. 
                        Please contact technical support if this persists.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    disabled={hasRlsError}
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
                    disabled={hasRlsError}
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
                    disabled={hasRlsError}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canSell"
                      checked={newUserCanSell}
                      onCheckedChange={(checked) => setNewUserCanSell(!!checked)}
                      disabled={hasRlsError}
                    />
                    <Label htmlFor="canSell" className="text-sm">{t("admin.canSell")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canRestock"
                      checked={newUserCanRestock}
                      onCheckedChange={(checked) => setNewUserCanRestock(!!checked)}
                      disabled={hasRlsError}
                    />
                    <Label htmlFor="canRestock" className="text-sm">{t("admin.canRestock")}</Label>
                  </div>
                </div>

                <Button 
                  onClick={addUser}
                  className="w-full bg-temple-maroon hover:bg-temple-maroon/90"
                  disabled={isAddingUser || hasRlsError}
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
                    {hasRlsError ? (
                      <>
                        <p>{t("admin.noUsersFound")}</p>
                        <p className="text-sm mt-2">
                          User data is temporarily unavailable due to database configuration issues.
                        </p>
                      </>
                    ) : (
                      <p>{t("admin.noUsersFound")}</p>
                    )}
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
                                  disabled={hasRlsError}
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
                                  disabled={hasRlsError}
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
        )}
      </div>
    </div>
  );
};

export default AdminPage;
