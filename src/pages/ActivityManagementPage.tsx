import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Users, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import MobileHeader from '@/components/MobileHeader';
import { useAuth } from '@/contexts/AuthContext';

interface Activity {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export default function ActivityManagementPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to fetch activities',
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
      const activityData = {
        ...formData,
        created_by: isUuid ? currentUser.id : null,
        institute_id: 'default'
      };

      if (editingActivity) {
        const { error } = await supabase
          .from('activities')
          .update(activityData)
          .eq('id', editingActivity.id);

        if (error) throw error;
        toast({
          title: t('common.success'),
          description: 'Activity updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('activities')
          .insert([activityData]);

        if (error) throw error;
        toast({
          title: t('common.success'),
          description: 'Activity added successfully'
        });
      }

      resetForm();
      fetchActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to save activity',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setEditingActivity(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (activity: Activity) => {
    setFormData({
      name: activity.name,
      description: activity.description || ''
    });
    setEditingActivity(activity);
    setIsAddDialogOpen(true);
  };

  const ActivityForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="activityName">Activity Name *</Label>
        <Input
          id="activityName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Dattatreya Homam, Satyanarayana Swamy Vratam"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the activity"
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Activity Management" />
      
      <div className="container mx-auto p-4 space-y-6">
        <Tabs defaultValue="activities" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="slots">Activity Slots</TabsTrigger>
          </TabsList>
          
          <TabsContent value="activities" className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">Activity Management</h1>
                <p className="text-muted-foreground">Manage religious activities and ceremonies</p>
              </div>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingActivity ? 'Edit Activity' : 'Add New Activity'}</DialogTitle>
                    <DialogDescription>
                      {editingActivity ? 'Update activity information' : 'Create a new religious activity or ceremony'}
                    </DialogDescription>
                  </DialogHeader>
                  <ActivityForm />
                  <DialogFooter>
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingActivity ? 'Update' : 'Add'} Activity
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Activities Grid */}
            {loading ? (
              <div className="text-center py-8">Loading activities...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map((activity) => (
                  <Card key={activity.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{activity.name}</CardTitle>
                          {activity.description && (
                            <CardDescription className="mt-2">
                              {activity.description}
                            </CardDescription>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(activity)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created {new Date(activity.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {activities.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No activities added yet. Add your first activity to get started.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="slots">
            <div className="text-center py-8 text-muted-foreground">
              Activity slots management will be available here.
              <br />
              Go to <strong>Slot Booking</strong> page to create activity slots with dates.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}