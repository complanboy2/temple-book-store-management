import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Download, Printer, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import MobileHeader from '@/components/MobileHeader';
import { format } from 'date-fns';

interface ActivitySlot {
  id: string;
  activity_id: string;
  scheduled_date: string;
  display_name: string;
  activities: {
    id: string;
    name: string;
    description?: string;
  };
}

interface UserBooking {
  id: string;
  user_metadata: {
    id: string;
    name: string;
    mobile_number: string;
    family_members?: string;
    gothram?: string;
    address?: string;
  };
  booking_date: string;
  notes?: string;
}

interface ActivityReport {
  slot: ActivitySlot;
  bookings: UserBooking[];
}

export default function ActivityReportsPage() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [activitySlots, setActivitySlots] = useState<ActivitySlot[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [reports, setReports] = useState<ActivityReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchSlotsForDate();
    }
  }, [selectedDate]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('name');

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to fetch activities',
        variant: 'destructive'
      });
    }
  };

  const fetchSlotsForDate = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      let query = supabase
        .from('activity_slots')
        .select(`
          *,
          activities(id, name, description)
        `)
        .eq('scheduled_date', dateStr);

      if (selectedActivity) {
        query = query.eq('activity_id', selectedActivity);
      }

      const { data, error } = await query.order('display_name');

      if (error) throw error;

      // Fetch bookings for each slot
      const reportsData: ActivityReport[] = [];
      for (const slot of data || []) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('user_activity_bookings')
          .select(`
            *,
            user_metadata(*)
          `)
          .eq('activity_slot_id', slot.id)
          .order('booking_date');

        if (bookingsError) throw bookingsError;

        reportsData.push({
          slot,
          bookings: bookings || []
        });
      }

      setReports(reportsData);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to fetch activity data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePrintableReport = (report: ActivityReport) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.slot.display_name} - Participant List</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #ddd; 
              padding-bottom: 20px;
            }
            .activity-title { 
              font-size: 24px; 
              font-weight: bold; 
              color: #2563eb;
              margin-bottom: 10px;
            }
            .date { 
              font-size: 16px; 
              color: #666; 
            }
            .participants-count {
              background: #f3f4f6;
              padding: 10px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
              font-weight: bold;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #f9fafb; 
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f9fafb; 
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="activity-title">${report.slot.activities.name}</div>
            <div class="date">Date: ${format(new Date(report.slot.scheduled_date), 'PPP')}</div>
          </div>
          
          <div class="participants-count">
            Total Participants: ${report.bookings.length}
          </div>

          ${report.bookings.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Mobile Number</th>
                  <th>Gothram</th>
                  <th>Family Members</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                ${report.bookings.map((booking, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${booking.user_metadata.name}</td>
                    <td>${booking.user_metadata.mobile_number}</td>
                    <td>${booking.user_metadata.gothram || '-'}</td>
                    <td>${booking.user_metadata.family_members || '-'}</td>
                    <td>${booking.user_metadata.address || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="text-align: center; color: #666; margin: 40px 0;">No participants registered for this activity.</p>'}

          <div class="footer">
            Generated on ${format(new Date(), 'PPP')} at ${format(new Date(), 'p')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToCSV = (report: ActivityReport) => {
    if (report.bookings.length === 0) {
      toast({
        title: 'No Data',
        description: 'No participants to export',
        variant: 'destructive'
      });
      return;
    }

    const headers = ['S.No', 'Name', 'Mobile Number', 'Gothram', 'Family Members', 'Address'];
    const csvContent = [
      headers.join(','),
      ...report.bookings.map((booking, index) => [
        index + 1,
        `"${booking.user_metadata.name}"`,
        booking.user_metadata.mobile_number,
        `"${booking.user_metadata.gothram || ''}"`,
        `"${booking.user_metadata.family_members || ''}"`,
        `"${booking.user_metadata.address || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.slot.display_name}_participants.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: 'Participant list exported to CSV'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Activity Reports" />
      
      <div className="container mx-auto p-4 space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-2xl font-bold">Activity Reports</h1>
          <p className="text-muted-foreground">View and export participant lists for activities</p>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Reports</CardTitle>
            <CardDescription>Select date and activity to view participant reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Date *</label>
                <DatePicker
                  date={selectedDate}
                  onDateChange={setSelectedDate}
                  placeholder="Choose date to view activities"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Filter by Activity (Optional)</label>
                <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All activities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All activities</SelectItem>
                    {activities.map((activity) => (
                      <SelectItem key={activity.id} value={activity.id}>
                        {activity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Section */}
        {loading && (
          <div className="text-center py-8">Loading reports...</div>
        )}

        {!loading && selectedDate && reports.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No activities found for the selected date and filters.
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div className="space-y-6">
            {reports.map((report) => (
              <Card key={report.slot.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {report.slot.activities.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {format(new Date(report.slot.scheduled_date), 'PPP')}
                      </CardDescription>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToCSV(report)}
                        disabled={report.bookings.length === 0}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePrintableReport(report)}
                      >
                        <Printer className="w-4 h-4 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="secondary">
                      <Users className="w-3 h-3 mr-1" />
                      {report.bookings.length} participants
                    </Badge>
                  </div>

                  {report.bookings.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium">Participants:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {report.bookings.map((booking, index) => (
                          <div key={booking.id} className="p-3 bg-muted rounded-lg">
                            <div className="font-medium">{index + 1}. {booking.user_metadata.name}</div>
                            <div className="text-sm text-muted-foreground">
                              📱 {booking.user_metadata.mobile_number}
                              {booking.user_metadata.gothram && ` • 🏛️ ${booking.user_metadata.gothram}`}
                            </div>
                            {booking.user_metadata.family_members && (
                              <div className="text-sm text-muted-foreground mt-1">
                                👨‍👩‍👧‍👦 {booking.user_metadata.family_members}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No participants registered for this activity.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}