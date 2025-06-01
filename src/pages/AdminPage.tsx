
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStallContext } from "@/contexts/StallContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import MobileHeader from "@/components/MobileHeader";
import { Users, UserPlus, Settings } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  canrestock: boolean;
  cansell: boolean;
  instituteid?: string;
}

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "personnel",
    canRestock: false,
    canSell: true
  });

  const { currentStore } = useStallContext();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [currentStore, isAdmin]);

  const fetchUsers = async () => {
    if (!currentStore) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('instituteid', currentStore)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: t("common.error"),
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    try {
      setIsAddingUser(true);
      const { error } = await supabase
        .from('users')
        .insert({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone || null,
          role: newUser.role,
          canrestock: newUser.canRestock,
          cansell: newUser.canSell,
          instituteid: currentStore
        });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: "User added successfully",
      });

      setNewUser({
        name: "",
        email: "",
        phone: "",
        role: "personnel",
        canRestock: false,
        canSell: true
      });

      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: t("common.error"),
        description: "Failed to add user",
        variant: "destructive",
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  const toggleUserPermission = async (userId: string, field: 'canrestock' | 'cansell', currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ [field]: !currentValue })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: "User permissions updated",
      });

      fetchUsers();
    } catch (error) {
      console.error("Error updating user permissions:", error);
      toast({
        title: t("common.error"),
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-temple-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-lg text-red-600">Access Denied</p>
            <p className="text-sm text-gray-600 mt-2">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader 
        title={t("common.admin")}
        showBackButton={true}
        backTo="/"
      />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Add New User */}
        <Card className="temple-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="personnel">Personnel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="canSell"
                  checked={newUser.canSell}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, canSell: checked })}
                />
                <Label htmlFor="canSell">Can Sell</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="canRestock"
                  checked={newUser.canRestock}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, canRestock: checked })}
                />
                <Label htmlFor="canRestock">Can Restock</Label>
              </div>

              <Button type="submit" className="w-full" disabled={isAddingUser}>
                {isAddingUser ? "Adding..." : "Add User"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="temple-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">{t("common.loading")}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mt-1">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.cansell}
                          onCheckedChange={() => toggleUserPermission(user.id, 'cansell', user.cansell)}
                        />
                        <Label className="text-sm">Can Sell</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.canrestock}
                          onCheckedChange={() => toggleUserPermission(user.id, 'canrestock', user.canrestock)}
                        />
                        <Label className="text-sm">Can Restock</Label>
                      </div>
                    </div>
                  </div>
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
