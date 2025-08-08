import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit, Phone, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import MobileHeader from '@/components/MobileHeader';
import { useAuth } from '@/contexts/AuthContext';

interface UserMetadata {
  id: string;
  name: string;
  mobile_number: string;
  family_members?: string;
  gothram?: string;
  address?: string;
  created_at: string;
}

export default function UserMetadataPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    mobile_number: '',
    family_members: '',
    gothram: '',
    address: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_metadata')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!currentUser) throw new Error('Not authenticated');

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(currentUser.id);
      const userData = {
        ...formData,
        created_by: isUuid ? currentUser.id : null,
        institute_id: 'default' // You might want to get this from context
      };

      if (editingUser) {
        const { error } = await supabase
          .from('user_metadata')
          .update(userData)
          .eq('id', editingUser.id);

        if (error) throw error;
        toast({
          title: t('common.success'),
          description: 'User updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('user_metadata')
          .insert([userData]);

        if (error) throw error;
        toast({
          title: t('common.success'),
          description: 'User added successfully'
        });
      }

      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to save user',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile_number: '',
      family_members: '',
      gothram: '',
      address: ''
    });
    setEditingUser(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (user: UserMetadata) => {
    setFormData({
      name: user.name,
      mobile_number: user.mobile_number,
      family_members: user.family_members || '',
      gothram: user.gothram || '',
      address: user.address || ''
    });
    setEditingUser(user);
    setIsAddDialogOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.mobile_number.includes(searchTerm) ||
    (user.gothram && user.gothram.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const UserForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="mobile">Mobile Number *</Label>
          <Input
            id="mobile"
            type="tel"
            value={formData.mobile_number}
            onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="gothram">Gothram</Label>
        <Input
          id="gothram"
          value={formData.gothram}
          onChange={(e) => setFormData({ ...formData, gothram: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="family">Family Members</Label>
        <Textarea
          id="family"
          value={formData.family_members}
          onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
          placeholder="Enter family member names separated by commas"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="User Management" />
      
      <div className="container mx-auto p-4 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage user metadata and information</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update user information' : 'Enter user details to add them to the system'}
                </DialogDescription>
              </DialogHeader>
              <UserForm />
              <DialogFooter>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingUser ? 'Update' : 'Add'} User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Section */}
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, mobile, or gothram..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      {user.gothram && (
                        <CardDescription className="mt-1">
                          Gothram: {user.gothram}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{user.mobile_number}</span>
                  </div>
                  
                  {user.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="line-clamp-2">{user.address}</span>
                    </div>
                  )}
                  
                  {user.family_members && (
                    <div className="text-sm">
                      <span className="font-medium">Family: </span>
                      <span className="text-muted-foreground line-clamp-2">
                        {user.family_members}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No users found matching your search.' : 'No users added yet.'}
          </div>
        )}
      </div>
    </div>
  );
}