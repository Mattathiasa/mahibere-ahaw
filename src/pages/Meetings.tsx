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
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

const Meetings = () => {
  const { t } = useTranslation();
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
        <PageHeader title={t('meetings')} description={t('meetingsHeaderDesc')} />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  const upcomingCount = upcomingMeetings.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 ease-out pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <PageHeader
            title={t('meetings')}
            description={t('meetingsHeaderDesc')}
            badge={`${upcomingCount} ${t('upcomingMeetings')}`}
          />
        </div>
        {permissions.canScheduleMeeting && (
          <div className="flex shrink-0">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-[#2E5E99] hover:scale-105 transition-all shadow-xl shadow-[#2E5E99]/20 font-bold tracking-wide">
                  <Plus className="mr-2 h-5 w-5" />
                  {t('scheduleMeeting')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-[2.5rem] bg-white/90 backdrop-blur-2xl border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-[#0D2440]">{t('scheduleMeeting')}</DialogTitle>
                  <DialogDescription className="text-[#2E5E99]/60">
                    Create a new leadership meeting and notify all relevant members
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
          </div>
        )}
      </div>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1.5 bg-[#2E5E99] rounded-full" />
            <h2 className="text-2xl font-black text-[#0D2440] dark:text-white tracking-tight italic">{t('upcomingMeetings')}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {upcomingMeetings.map((meeting: any, index: number) => {
                const status = getMeetingStatus(meeting.scheduledDate);
                return (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="group relative h-full flex flex-col rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10 hover:shadow-2xl hover:shadow-[#2E5E99]/20 transition-all duration-500 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2E5E99]/5 to-[#7BA4D0]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <CardHeader className="relative pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-2xl font-black text-[#0D2440] dark:text-white leading-tight group-hover:text-[#2E5E99] transition-colors">{meeting.title}</CardTitle>
                            <div className="flex flex-wrap gap-4 mt-4">
                              <div className="flex items-center gap-2 text-sm font-bold text-[#2E5E99] bg-[#2E5E99]/10 px-3 py-1.5 rounded-xl border border-[#2E5E99]/10">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(meeting.scheduledDate), 'PPP')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm font-bold text-[#2E5E99] bg-[#2E5E99]/10 px-3 py-1.5 rounded-xl border border-[#2E5E99]/10">
                                <Clock className="h-4 w-4" />
                                <span>{format(new Date(meeting.scheduledDate), 'p')}</span>
                              </div>
                            </div>
                          </div>
                          <Badge className={`${status.color} rounded-full px-4 py-1.5 border-none shadow-sm uppercase tracking-widest text-[10px] font-black`}>
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="relative space-y-6 pb-8 flex-1">
                        <p className="text-[#0D2440]/70 dark:text-white/70 leading-relaxed font-semibold italic">{meeting.description}</p>
                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-2xl bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 hover:bg-[#2E5E99] hover:text-white hover:border-transparent transition-all shadow-lg font-bold"
                            onClick={() => handleAddToCalendar(meeting)}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Add to Calendar
                          </Button>
                          {permissions.canScheduleMeeting && (
                            <Button
                              variant="destructive"
                              className="h-12 w-12 rounded-2xl shadow-lg hover:rotate-12 transition-transform"
                              onClick={() => handleDelete(meeting.id, meeting.title)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1.5 bg-[#2E5E99]/30 rounded-full" />
            <h2 className="text-2xl font-black text-[#0D2440]/40 dark:text-white/40 tracking-tight">{t('pastMeetings')}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {pastMeetings.map((meeting: any) => {
              const status = getMeetingStatus(meeting.scheduledDate);
              return (
                <Card key={meeting.id} className="group hover:scale-95 transition-all duration-500 opacity-60 hover:opacity-100 rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-white/40">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold">{meeting.title}</CardTitle>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(meeting.scheduledDate), 'PPP')}</span>
                          </div>
                        </div>
                      </div>
                      <Badge className={`${status.color} opacity-50`}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm line-clamp-2">{meeting.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {meetings.length === 0 && (
        <div className="group relative py-20 px-6 rounded-[3rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/40 dark:border-white/10 text-center flex flex-col items-center select-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E5E99]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative p-6 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] mb-6 animate-pulse">
            <Calendar className="h-14 w-14" />
          </div>
          <h3 className="relative text-2xl font-black text-[#0D2440] dark:text-white mb-3">No meetings scheduled</h3>
          <p className="relative text-[#2E5E99]/60 max-w-sm mb-8 font-medium">
            {permissions.canScheduleMeeting
              ? 'Schedule your first meeting to get started with organizational activities.'
              : 'No meetings have been scheduled yet for this level.'}
          </p>
          {permissions.canScheduleMeeting && (
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="relative px-8 h-12 rounded-2xl bg-[#2E5E99] text-white font-bold hover:scale-110 transition-all shadow-xl shadow-[#2E5E99]/20"
            >
              <Plus className="mr-2 h-5 w-5" />
              Schedule Meeting
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Meetings;
