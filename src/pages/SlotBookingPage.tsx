import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Search, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import MobileHeader from '@/components/MobileHeader';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Activity {
  id: string;
  name: string;
  description?: string;
}

interface ActivitySlot {
  id: string;
  activity_id: string;
  scheduled_date: string;
  display_name: string;
  activities: Activity;
  booking_count?: number;
}

interface UserMetadata {
  id: string;
  name: string;
  mobile_number: string;
  gothram?: string;
}

interface UserBooking {
  id: string;
  user_metadata: UserMetadata;
  booking_date: string;
  notes?: string;
}

export default function SlotBookingPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitySlots, setActivitySlots] = useState<ActivitySlot[]>([]);
  const [users, setUsers] = useState<UserMetadata[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ActivitySlot | null>(null);
  const [slotBookings, setSlotBookings] = useState<UserBooking[]>([]);
  const [isCreateSlotOpen, setIsCreateSlotOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotForm, setSlotForm] = useState({
    activity_id: '',
    scheduled_date: null as Date | null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [activitiesRes, slotsRes, usersRes] = await Promise.all([
        supabase.from('activities').select('*').order('name'),
        supabase.from('activity_slots').select(`
          *,
          activities(id, name, description)
        `).order('scheduled_date', { ascending: false }),
        supabase.from('user_metadata').select('id, name, mobile_number, gothram').order('name')
      ]);

      if (activitiesRes.error) throw activitiesRes.error;
      if (slotsRes.error) throw slotsRes.error;
      if (usersRes.error) throw usersRes.error;

      setActivities(activitiesRes.data || []);
      setActivitySlots(slotsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to fetch data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSlotBookings = async (slotId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_activity_bookings')
        .select(`
          *,
          user_metadata(id, name, mobile_number, gothram)
        `)
        .eq('activity_slot_id', slotId)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      setSlotBookings(data || []);
    } catch (error) {
      console.error('Error fetching slot bookings:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to fetch bookings',
        variant: 'destructive'
      });
    }
  };

  const handleCreateSlot = async () => {
    try {
      if (!slotForm.activity_id || !slotForm.scheduled_date) {
        toast({
          title: t('common.error'),
          description: 'Please select activity and date',
          variant: 'destructive'
        });
        return;
      }

      if (!currentUser) throw new Error('Not authenticated');

      const activity = activities.find(a => a.id === slotForm.activity_id);
      if (!activity) return;

      const displayName = `${activity.name} - ${format(slotForm.scheduled_date, 'yyyy-MM-dd')}`;

      const { error } = await supabase
        .from('activity_slots')
        .insert([{
          activity_id: slotForm.activity_id,
          scheduled_date: format(slotForm.scheduled_date, 'yyyy-MM-dd'),
          display_name: displayName,
        created_by: currentUser.id,
          institute_id: 'default'
        }]);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: 'Activity slot created successfully'
      });

      setSlotForm({ activity_id: '', scheduled_date: null });
      setIsCreateSlotOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating slot:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to create activity slot',
        variant: 'destructive'
      });
    }
  };

  const handleAddUserToSlot = async (userId: string) => {
    try {
      if (!selectedSlot) return;

      if (!currentUser) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_activity_bookings')
        .insert([{
          user_metadata_id: userId,
          activity_slot_id: selectedSlot.id,
          created_by: currentUser.id,
          institute_id: 'default'
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: t('common.error'),
            description: 'User is already booked for this activity',
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }

      toast({
        title: t('common.success'),
        description: 'User added to activity successfully'
      });

      setIsAddUserOpen(false);
      setUserSearchTerm('');
      fetchSlotBookings(selectedSlot.id);
    } catch (error) {
      console.error('Error adding user to slot:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to add user to activity',
        variant: 'destructive'
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.mobile_number.includes(userSearchTerm) ||
    (user.gothram && user.gothram.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Slot Booking" />
      
      <div className="container mx-auto p-4 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Activity Slot Booking</h1>
            <p className="text-muted-foreground">Create activity slots and manage user bookings</p>
          </div>
          
          <Dialog open={isCreateSlotOpen} onOpenChange={setIsCreateSlotOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Activity Slot</DialogTitle>
                <DialogDescription>
                  Schedule an activity for a specific date
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Activity</Label>
                  <Select value={slotForm.activity_id} onValueChange={(value) => setSlotForm({ ...slotForm, activity_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Select Date</Label>
                  <DatePicker
                    date={slotForm.scheduled_date}
                    onDateChange={(date) => setSlotForm({ ...slotForm, scheduled_date: date })}
                    placeholder="Choose activity date"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateSlotOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSlot}>
                  Create Slot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Activity Slots Grid */}
        {loading ? (
          <div className="text-center py-8">Loading activity slots...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activitySlots.map((slot) => (
              <Card key={slot.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedSlot(slot);
                      fetchSlotBookings(slot.id);
                    }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{slot.activities.name}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(slot.scheduled_date), 'PPP')}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <Users className="w-3 h-3 mr-1" />
                      {slot.booking_count || 0} booked
                    </Badge>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activitySlots.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            No activity slots created yet. Create your first slot to start booking users.
          </div>
        )}

        {/* Selected Slot Details */}
        {selectedSlot && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedSlot.display_name}</CardTitle>
                  <CardDescription>
                    Manage participants for this activity
                  </CardDescription>
                </div>
                
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add User to Activity</DialogTitle>
                      <DialogDescription>
                        Search and select a user to add to {selectedSlot.display_name}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, mobile, or gothram..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredUsers.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {user.mobile_number} {user.gothram && `• ${user.gothram}`}
                              </p>
                            </div>
                            <Button size="sm" onClick={() => handleAddUserToSlot(user.id)}>
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-medium">Participants ({slotBookings.length})</h4>
                {slotBookings.length === 0 ? (
                  <p className="text-muted-foreground">No participants added yet</p>
                ) : (
                  <div className="space-y-2">
                    {slotBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">{booking.user_metadata.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.user_metadata.mobile_number}
                            {booking.user_metadata.gothram && ` • ${booking.user_metadata.gothram}`}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {format(new Date(booking.booking_date), 'MMM dd')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}