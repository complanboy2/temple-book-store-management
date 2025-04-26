
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Trash2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'super_admin' | 'admin' | 'personnel';
}

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "admin" as const,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'super_admin') {
      navigate("/");
      return;
    }
    
    fetchUsers();
  }, [currentUser, navigate]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('role', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
      return;
    }

    setUsers(data as User[]);
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .insert([{
          ...newUser,
          canrestock: true,
          cansell: true,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User added successfully",
      });
      
      setIsAddUserOpen(false);
      setNewUser({ name: "", email: "", phone: "", role: "admin" });
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const generateWhatsAppMessage = (user: typeof newUser) => {
    const message = `Welcome to Temple Book Manager!\n\n` +
      `Your account details:\n` +
      `Name: ${user.name}\n` +
      `Email: ${user.email}\n` +
      `Role: ${user.role}\n\n` +
      `Please complete your registration by clicking on this link: ${window.location.origin}/complete-signup/[INVITE_CODE]`;
    
    return `https://wa.me/${user.phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-temple-background pb-20">
      <MobileHeader title="Super Admin Panel" showBackButton={true} />
      
      <div className="mobile-container">
        <div className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-temple-saffron hover:bg-temple-saffron/90">
                    <UserPlus size={16} className="mr-2" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Administrator</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name *</label>
                      <Input
                        placeholder="Full Name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone (with country code)</label>
                      <Input
                        placeholder="+91 1234567890"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      />
                    </div>
                    <Button
                      className="w-full bg-temple-saffron hover:bg-temple-saffron/90"
                      onClick={handleAddUser}
                      disabled={isLoading}
                    >
                      {isLoading ? "Adding..." : "Add Administrator"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border border-temple-gold/20 rounded-lg bg-white shadow-sm"
                  >
                    <div>
                      <h3 className="font-medium text-temple-maroon">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <span className="text-xs px-2 py-1 bg-temple-gold/10 rounded-full">
                        {user.role}
                      </span>
                    </div>
                    {user.role !== 'super_admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;
