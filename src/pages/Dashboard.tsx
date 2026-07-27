import { useState, useEffect } from 'react';
import {
  Bell, Calendar, FileText, Users as UsersIcon, Clock, Sparkles, ArrowRight, Zap, Mail,
  Phone, Briefcase, Heart, Baby, UserCircle, ShieldCheck, Building, Search, Share2,
  DollarSign, UserPlus, MessageSquare, UserCheck, PlusCircle, BookOpen
} from 'lucide-react';
import { toDate, toEthiopianDateString } from '@/lib/date-utils';
import { StatCard } from '@/components/StatCard';
import AnnouncementCard from '@/components/AnnouncementCard';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const permissions = useRolePermissions();
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();

  const [timeString, setTimeString] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const ethDate = toEthiopianDateString();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboardData(),
    refetchInterval: 30000,
  });

  const stats = dashboardData ? [
    { title: t('totalMembers'),        value: dashboardData.stats.totalMembers.toString(),        icon: UsersIcon, color: 'text-primary',    bgColor: 'bg-primary/10' },
    { title: t('activeAnnouncements'), value: dashboardData.stats.activeAnnouncements.toString(), icon: Bell,      color: 'text-secondary',  bgColor: 'bg-secondary/10' },
    { title: t('pendingReports'),      value: dashboardData.stats.pendingReports.toString(),      icon: FileText,  color: 'text-accent',     bgColor: 'bg-accent/10' },
    { title: t('upcomingMeetings'),    value: dashboardData.stats.upcomingMeetings.toString(),    icon: Calendar,  color: 'text-primary',    bgColor: 'bg-primary/10' },
  ] : [];

  const recentAnnouncements = dashboardData?.recentAnnouncements || [];
  const recentReports       = dashboardData?.recentReports       || [];
  const upcomingMeetings    = dashboardData?.upcomingMeetings    || [];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <LoadingSkeleton type="stats" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">

      {/* ── Hero Profile & Live Ethiopian Clock Card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-white/60 dark:bg-[#0D2440]/60 backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#2E5E99]/5 rounded-full -mr-64 -mt-64 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] dark:text-[#7BA4D0] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20 shadow-inner">
                <UserCircle className="h-4 w-4" />
                {t('memberProfile')}
              </div>
              {/* Ethiopian Live Calendar Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                <Clock className="h-3.5 w-3.5" />
                <span>{timeString}</span> • <span>ዕለተ፡ {ethDate}</span>
              </div>
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
                <Badge className="bg-[#2E5E99]/10 text-[#2E5E99] dark:text-[#7BA4D0] border-none uppercase tracking-widest text-[10px] px-3 py-1">
                  <Building className="w-3 h-3 mr-1 inline" />
                  {currentUser.hierarchyLevel}
                </Badge>
              )}
              {currentUser?.role && (
                <Badge className="bg-[#7BA4D0]/10 text-[#7BA4D0] border-none uppercase tracking-widest text-[10px] px-3 py-1">
                  <ShieldCheck className="w-3 h-3 mr-1 inline" />
                  {t('role')}: {currentUser.role}
                </Badge>
              )}
            </div>
          </div>

          <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-3 gap-6 lg:pl-8 lg:border-l border-[#2E5E99]/10 dark:border-white/5">
            {currentUser?.username && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-[#2E5E99]/60">{t('username')}</p>
                <p className="text-sm font-bold text-[#0D2440] dark:text-white flex items-center gap-1.5">
                  <UserCircle className="w-3.5 h-3.5 opacity-50 text-[#2E5E99]" /> {currentUser.username}
                </p>
              </div>
            )}
            {currentUser?.email && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-[#2E5E99]/60">{t('email')}</p>
                <p className="text-sm font-bold text-[#0D2440] dark:text-white flex items-center gap-1.5 truncate max-w-[150px]" title={currentUser.email}>
                  <Mail className="w-3.5 h-3.5 opacity-50 text-[#2E5E99]" /> {currentUser.email.split('@')[0]}@...
                </p>
              </div>
            )}
            {currentUser?.phone && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest font-black text-[#2E5E99]/60">{t('phone')}</p>
                <p className="text-sm font-bold text-[#0D2440] dark:text-white flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 opacity-50 text-[#2E5E99]" /> {currentUser.phone}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Daily Verse & Member Search Widget ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Daily Verse (የዕለቱ ጥቅስ) Widget */}
        <Card className="md:col-span-8 bg-gradient-to-br from-white/60 to-white/30 dark:from-[#0D2440]/60 dark:to-[#0D2440]/30 backdrop-blur-2xl border-white/20 dark:border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#2E5E99]/10 dark:border-white/10 pb-3 mb-4">
            <h3 className="text-xl font-bold font-ethiopic text-[#0D2440] dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#2E5E99]" />
              የዕለቱ ጥቅስ
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText("ሁለተኞቱም ይህችን ትመስላለች፤ እርስዋም። ባልንጀራህን እንደ ነፍስህ ውደድ የምትለው ናት። - የማቴዎስ ወንጌል 22:39");
                toast.success("Daily verse copied!");
              }}
              className="text-[#2E5E99] hover:bg-[#2E5E99]/10 rounded-full"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          <blockquote className="text-lg sm:text-xl font-medium font-ethiopic leading-relaxed text-[#0D2440] dark:text-slate-100">
            "ሁለተኞቱም ይህችን ትመስላለች፤ እርስዋም። ባልንጀራህን እንደ ነፍስህ ውደድ የምትለው ናት።"
          </blockquote>
          <p className="text-[#2E5E99] font-bold text-sm font-ethiopic mt-3">
            የማቴዎስ ወንጌል 22:39
          </p>
        </Card>

        {/* Member Search Bar Widget */}
        <Card className="md:col-span-4 bg-white/60 dark:bg-[#0D2440]/60 backdrop-blur-2xl border-white/20 dark:border-white/5 rounded-[2rem] p-6 shadow-xl flex flex-col justify-center gap-3">
          <label className="text-xs font-black uppercase tracking-widest text-[#2E5E99]">Member Search</label>
          <div className="flex gap-2">
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search member name..."
              className="rounded-xl border-[#2E5E99]/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && memberSearch.trim()) {
                  navigate(`/members?search=${encodeURIComponent(memberSearch)}`);
                }
              }}
            />
            <Button
              onClick={() => navigate(`/members?search=${encodeURIComponent(memberSearch)}`)}
              className="bg-[#2E5E99] hover:bg-[#204a7c] text-white rounded-xl"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <StatCard {...stat} className="backdrop-blur-xl bg-white/40 dark:bg-white/5 border-[#2E5E99]/10 hover:shadow-2xl hover:shadow-[#2E5E99]/10 transition-all duration-500 rounded-3xl p-6" />
          </motion.div>
        ))}
      </div>

      {/* ── Comprehensive Quick Actions Grid (Quickboard Actions) ── */}
      {permissions.dashboardView !== 'basic' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight text-[#0D2440] dark:text-white flex items-center gap-3">
            <Zap className="h-6 w-6 text-[#2E5E99]" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { to: '/members?action=register', icon: UserPlus, title: 'Register Member', color: 'text-indigo-500' },
              { to: '/announcements?action=send', icon: MessageSquare, title: 'Send Message', color: 'text-sky-500' },
              { to: '/finance?action=revenue', icon: DollarSign, title: 'Record Revenue', color: 'text-emerald-500' },
              { to: '/finance?action=requisition', icon: FileText, title: 'Request Requisition', color: 'text-amber-500' },
              { to: '/hr?action=add', icon: UserCheck, title: 'Add Staff', color: 'text-purple-500' },
              { to: '/inventory?action=add', icon: PlusCircle, title: 'Add Asset', color: 'text-teal-500' },
            ].map((act, i) => (
              <Link key={i} to={act.to}>
                <motion.div whileHover={{ scale: 1.05, y: -4 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="w-full h-32 flex flex-col justify-center items-center gap-3 p-4 rounded-3xl border-[#2E5E99]/10 backdrop-blur-xl bg-white/40 dark:bg-white/5 shadow-sm hover:shadow-xl hover:bg-white/60 group">
                    <div className={`p-3 rounded-2xl bg-white/50 dark:bg-black/20 ${act.color}`}>
                      <act.icon className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-xs text-[#0D2440] dark:text-white text-center leading-tight">
                      {act.title}
                    </span>
                  </Button>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column - Recent Announcements */}
        <div className="lg:col-span-2 space-y-8">
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
                  <motion.div key={announcement.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.1 }}>
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
        </div>

        {/* Sidebar - Upcoming Meetings & Recent Reports */}
        <div className="space-y-8">
          <section className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight text-[#0D2440] dark:text-white flex items-center gap-3">
              <Calendar className="h-6 w-6 text-[#2E5E99]" />
              {t('upcomingMeetings')}
            </h2>
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting: any, idx: number) => (
                  <motion.div key={meeting.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + idx * 0.1 }}>
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
                <p className="text-xs font-black uppercase tracking-widest text-[#0D2440]/30 dark:text-white/30">
                  {t('noUpcomingMeetings')}
                </p>
              </div>
            )}
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight text-[#0D2440] dark:text-white flex items-center gap-3">
              <FileText className="h-6 w-6 text-[#2E5E99]" />
              {t('recentReports')}
            </h2>
            {recentReports.length > 0 ? (
              <div className="space-y-4">
                {recentReports.map((report: any, idx: number) => (
                  <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + idx * 0.1 }}>
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
                <p className="text-xs font-black uppercase tracking-widest text-[#0D2440]/30 dark:text-white/30">
                  {t('noReportsSubmitted')}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
