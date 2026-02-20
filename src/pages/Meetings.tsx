import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Plus, Trash2, Clock } from 'lucide-react';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingService } from '@/services/meetings';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useRolePermissions } from '@/hooks/useRolePermissions';

const Meetings = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledDate: '',
  });
  const queryClient = useQueryClient();
  const permissions = useRolePermissions();

  const { data: meetingsData, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => meetingService.getAllMeetings(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; description: string; scheduledDate: string }) =>
      meetingService.createMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Meeting scheduled and notifications sent!');
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', scheduledDate: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to schedule meeting');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => meetingService.deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete meeting');
    },
  });

  const meetings = meetingsData?.meetings || [];

  // Separate meetings into upcoming and past
  const upcomingMeetings = meetings.filter((m: any) => isFuture(new Date(m.scheduledDate)) || isToday(new Date(m.scheduledDate)));
  const pastMeetings = meetings.filter((m: any) => isPast(new Date(m.scheduledDate)) && !isToday(new Date(m.scheduledDate)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddToCalendar = (meeting: any) => {
    // Create ICS file for calendar
    const startDate = new Date(meeting.scheduledDate);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${meeting.title}`,
      `DESCRIPTION:${meeting.description}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meeting.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Calendar event downloaded!');
  };

  const getMeetingStatus = (scheduledDate: string) => {
    const date = new Date(scheduledDate);
    if (isToday(date)) return { label: 'Today', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    if (isFuture(date)) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
    return { label: 'Past', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' };
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sinodos Meetings</h1>
          <p className="text-muted-foreground mt-1">Leadership meetings and council sessions</p>
        </div>
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sinodos Meetings</h1>
          <p className="text-muted-foreground mt-1">
            Leadership meetings and council sessions ({meetings.length} total)
          </p>
        </div>
        {permissions.canScheduleMeeting && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Meeting</DialogTitle>
                <DialogDescription>
                  Create a new Sinodos meeting and notify all members
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter meeting title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date & Time *</Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter meeting description and agenda"
                    rows={6}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Scheduling...' : 'Schedule Meeting'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Upcoming Meetings</h2>
          <div className="space-y-4">
            {upcomingMeetings.map((meeting: any) => {
              const status = getMeetingStatus(meeting.scheduledDate);
              return (
                <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl">{meeting.title}</CardTitle>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(meeting.scheduledDate), 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(meeting.scheduledDate), 'p')}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">{meeting.description}</p>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAddToCalendar(meeting)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Add to Calendar
                      </Button>
                      {permissions.canScheduleMeeting && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(meeting.id, meeting.title)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Past Meetings</h2>
          <div className="space-y-4">
            {pastMeetings.map((meeting: any) => {
              const status = getMeetingStatus(meeting.scheduledDate);
              return (
                <Card key={meeting.id} className="hover:shadow-lg transition-shadow opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{meeting.title}</CardTitle>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(meeting.scheduledDate), 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(meeting.scheduledDate), 'p')}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-sm">{meeting.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {meetings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No meetings scheduled</h3>
          <p className="text-muted-foreground mb-4">
            {permissions.canScheduleMeeting
              ? 'Schedule your first meeting to get started.'
              : 'No meetings have been scheduled yet.'}
          </p>
          {permissions.canScheduleMeeting && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Meetings;
