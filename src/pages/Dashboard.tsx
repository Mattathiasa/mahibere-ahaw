import { Bell, Calendar, FileText, Users as UsersIcon, Clock, Sparkles, ArrowRight, Zap, Mail, Phone, Briefcase, Heart, Baby, GraduationCap, MapPin, UserCircle, ShieldCheck, Building } from 'lucide-react';
import { toDate } from '@/lib/date-utils';
import { StatCard } from '@/components/StatCard';
import AnnouncementCard from '@/components/AnnouncementCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const permissions = useRolePermissions();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboardData(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const stats = dashboardData ? [
    {
      title: t('totalMembers'),
      value: dashboardData.stats.totalMembers.toString(),
      icon: UsersIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('activeAnnouncements'),
      value: dashboardData.stats.activeAnnouncements.toString(),
      icon: Bell,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      title: t('pendingReports'),
      value: dashboardData.stats.pendingReports.toString(),
      icon: FileText,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: t('upcomingMeetings'),
      value: dashboardData.stats.upcomingMeetings.toString(),
      icon: Calendar,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ] : [];

  const recentAnnouncements = dashboardData?.recentAnnouncements || [];
  const recentReports = dashboardData?.recentReports || [];
  const upcomingMeetings = dashboardData?.upcomingMeetings || [];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <LoadingSkeleton type="stats" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* User Profile / Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white/60 dark:bg-[#0D2440]/60 backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2E5E99]/5 rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">

          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20 shadow-inner">
              <UserCircle className="h-4 w-4" />
              Member Profile
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#0D2440] dark:text-white font-ethiopic leading-tight">
              {currentUser?.fullNameEnglish || currentUser?.fullName || 'Church Member'}
              {currentUser?.fullNameAmharic && (
                <span className="block text-2xl mt-2 text-[#2E5E99]/80 font-ethiopic">
                  {currentUser.fullNameAmharic}
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {currentUser?.hierarchyLevel && (
                <Badge className="bg-[#2E5E99]/10 text-[#2E5E99] border-none uppercase tracking-widest text-[10px] px-3 py-1">
                  <Building className="w-3 h-3 mr-1 inline" />
                  {currentUser.hierarchyLevel}
                </Badge>
              )}
              {currentUser?.role && (
                <Badge className="bg-[#7BA4D0]/10 text-[#7BA4D0] border-none uppercase tracking-widest text-[10px] px-3 py-1">
                  <ShieldCheck className="w-3 h-3 mr-1 inline" />
                  Role: {currentUser.role}
                </Badge>
              )}
              <span className="text-xs font-bold text-[#0D2440]/50 dark:text-white/50 ml-2">
                <Calendar className="w-3 h-3 inline mr-1" />
                Joined: {currentUser?.createdAt ? format(toDate(currentUser.createdAt), 'MMM yyyy') : 'Recently'}
              </span>
            </div>
          </div>

          <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-3 gap-6 lg:pl-8 lg:border-l border-[#2E5E99]/10 dark:border-white/5">
            {currentUser?.username && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-[#2E5E99]/60">Username</p>
                <p className="text-sm font-bold text-[#0D2440] dark:text-white flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5 opacity-50 text-[#2E5E99]" /> {currentUser.username}</p>
              </div>
            )}
            {currentUser?.email && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-[#2E5E99]/60">Email</p>
                <p className="text-sm font-bold text-[#0D2440] dark:text-white flex items-center gap-1.5 truncate max-w-[150px]" title={currentUser.email}>
                  <Mail className="w-3.5 h-3.5 opacity-50 text-[#2E5E99]" /> {currentUser.email.split('@')[0]}@...
                </p>
              </div>
            )}
            {currentUser?.phone && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-[#2E5E99]/60">Phone</p>
                <p className="text-sm font-bold text-[#0D2440] dark:text-white flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 opacity-50 text-[#2E5E99]" /> {currentUser.phone}</p>
              </div>
            )}
            {currentUser?.dateOfBirth && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-[#2E5E99]/60">Date of Birth</p>
                <p className="text-sm font-bold text-[#0D2440] dark:text-white flex items-center gap-1.5"><Baby className="w-3.5 h-3.5 opacity-50 text-[#2E5E99]" /> {format(toDate(currentUser.dateOfBirth), 'MMM d, yyyy')}</p>
              </div>
            )}
            {currentUser?.workSchool && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-[#2E5E99]/60">Work / School</p>
                <p className="text-sm font-bold text-[#0D2440] dark:text-white flex items-center gap-1.5 truncate max-w-[130px]" title={currentUser.workSchool}>
                  <Briefcase className="w-3.5 h-3.5 opacity-50 text-[#2E5E99]" /> {currentUser.workSchool}
                </p>
              </div>
            )}
            {currentUser?.maritalStatus && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-[#2E5E99]/60">Status</p>
                <p className="text-sm font-bold text-[#0D2440] dark:text-white flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 opacity-50 text-[#2E5E99]" />
                  {currentUser.maritalStatus} {currentUser.hasChildren ? `(${currentUser.childrenCount || 0} Kids)` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} className="backdrop-blur-xl bg-white/40 dark:bg-white/5 border-[#2E5E99]/10 hover:shadow-2xl hover:shadow-[#2E5E99]/10 transition-all duration-500 rounded-3xl p-6" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Announcements */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight text-[#0D2440] dark:text-white flex items-center gap-3">
                <Bell className="h-6 w-6 text-[#2E5E99]" />
                {t('recentAnnouncements')}
              </h2>
              <Link to="/announcements">
                <Button variant="ghost" className="rounded-xl hover:bg-[#2E5E99]/10 font-bold text-[#2E5E99]">
                  {t('viewAll')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {recentAnnouncements.length > 0 ? (
              <div className="grid gap-4">
                {recentAnnouncements.map((announcement, idx) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                  >
                    <AnnouncementCard announcement={announcement} className="backdrop-blur-xl bg-white/40 dark:bg-white/5 border-[#2E5E99]/10 rounded-2xl p-4" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="backdrop-blur-none bg-white/20 dark:bg-white/5 border-dashed border-2 border-[#2E5E99]/10 p-12 text-center rounded-3xl">
                <Bell className="h-12 w-12 text-[#2E5E99]/20 mx-auto mb-4" />
                <p className="text-[#0D2440]/40 dark:text-white/40 font-bold uppercase tracking-widest text-xs">
                  {t('noAnnouncementsAvailable')}
                </p>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          {permissions.dashboardView !== 'basic' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black tracking-tight text-[#0D2440] dark:text-white flex items-center gap-3">
                <Zap className="h-6 w-6 text-[#2E5E99]" />
                Divine Tasks
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { to: "/reports", icon: FileText, title: t('submitReport'), desc: t('trackMinistryProgress') },
                  { to: "/members", icon: UsersIcon, title: t('viewMembers'), desc: t('manageChurchMembers') },
                  { to: "/announcements", icon: Bell, title: t('announcements'), desc: t('latestChurchUpdates') },
                ].map((action, i) => (
                  <Link key={i} to={action.to}>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="h-full"
                    >
                      <Button variant="outline" className="w-full h-full justify-start p-6 rounded-3xl border-[#2E5E99]/10 backdrop-blur-xl bg-white/40 dark:bg-white/5 shadow-sm hover:shadow-xl hover:shadow-[#2E5E99]/5 hover:bg-white/60 group" size="lg">
                        <div className="flex flex-col gap-4 text-left">
                          <div className="p-3 rounded-2xl bg-[#2E5E99]/10 text-[#2E5E99] group-hover:bg-[#2E5E99] group-hover:text-white transition-colors w-fit">
                            <action.icon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-black text-lg text-[#0D2440] dark:text-white font-ethiopic">{action.title}</p>
                            <p className="text-xs text-[#0D2440]/60 dark:text-white/60 font-medium">{action.desc}</p>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          {/* Upcoming Meetings */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight text-[#0D2440] dark:text-white flex items-center gap-3">
              <Calendar className="h-6 w-6 text-[#2E5E99]" />
              {t('upcomingMeetings')}
            </h2>
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting: any, idx: number) => (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (idx * 0.1) }}
                  >
                    <Card className="group hover:shadow-xl hover:shadow-[#2E5E99]/5 transition-all duration-500 border-[#2E5E99]/10 backdrop-blur-xl bg-white/40 dark:bg-white/5 rounded-2xl overflow-hidden">
                      <CardHeader className="p-5 pb-0">
                        <CardTitle className="text-lg font-black font-ethiopic text-[#0D2440] dark:text-white">{meeting.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 text-sm font-bold text-[#2E5E99]">
                          <div className="p-2 rounded-lg bg-[#2E5E99]/10">
                            <Clock className="h-4 w-4" />
                          </div>
                          <span>{format(toDate(meeting.scheduledDate), 'MMM d, h:mm a')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-3xl border-2 border-dashed border-[#2E5E99]/10 text-center">
                <p className="text-xs font-black uppercase tracking-widest text-[#0D2440]/30 dark:text-white/30">{t('noUpcomingMeetings')}</p>
              </div>
            )}
          </section>

          {/* Recent Reports */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight text-[#0D2440] dark:text-white flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#2E5E99]" />
              {t('recentReports')}
            </h2>
            {recentReports.length > 0 ? (
              <div className="space-y-4">
                {recentReports.map((report: any, idx: number) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + (idx * 0.1) }}
                  >
                    <Card className="hover:shadow-xl hover:shadow-[#2E5E99]/5 transition-all duration-500 border-[#2E5E99]/10 backdrop-blur-xl bg-white/40 dark:bg-white/5 rounded-2xl overflow-hidden">
                      <CardHeader className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="text-sm font-black font-ethiopic leading-snug">{report.planName}</CardTitle>
                          <Badge variant="outline" className="bg-[#2E5E99]/10 text-[#2E5E99] border-none font-black text-[10px] py-1">{report.option}</Badge>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0D2440]/40 dark:text-white/40">
                          <Clock className="h-3 w-3" />
                          {format(toDate(report.submittedAt), 'PPP')}
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-3xl border-2 border-dashed border-[#2E5E99]/10 text-center">
                <p className="text-xs font-black uppercase tracking-widest text-[#0D2440]/30 dark:text-white/30">{t('noReportsSubmitted')}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
