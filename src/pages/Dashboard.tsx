import { Bell, Calendar, FileText, Users as UsersIcon, Clock } from 'lucide-react';
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
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
          {t('welcome')}, {currentUser.fullName}
        </h1>
        <p className="text-muted-foreground text-lg">
          {currentUser.hierarchyLevel} · {currentUser.ministryType}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Recent Announcements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">{t('recentAnnouncements')}</h2>
          <Link to="/announcements">
            <Button variant="outline">{t('viewAll')}</Button>
          </Link>
        </div>
        {recentAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {recentAnnouncements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('noAnnouncementsAvailable')}
          </div>
        )}
      </div>

      {/* Recent Reports and Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">{t('recentReports')}</h2>
            <Link to="/reports">
              <Button variant="outline" size="sm">{t('viewAll')}</Button>
            </Link>
          </div>
          {recentReports.length > 0 ? (
            <div className="space-y-3">
              {recentReports.map((report: any) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{report.planName}</CardTitle>
                      <Badge variant="outline" className="text-xs">{report.option}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(report.submittedAt), 'PPP')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t('noReportsSubmitted')}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">{t('upcomingMeetings')}</h2>
            <Link to="/meetings">
              <Button variant="outline" size="sm">{t('viewAll')}</Button>
            </Link>
          </div>
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeetings.map((meeting: any) => (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{meeting.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(meeting.scheduledDate), 'PPP p')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t('noUpcomingMeetings')}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {permissions.dashboardView !== 'basic' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/reports">
            <Button variant="outline" className="w-full justify-start h-auto py-4" size="lg">
              <FileText className="mr-3 h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">{t('submitReport')}</p>
                <p className="text-xs text-muted-foreground">{t('trackMinistryProgress')}</p>
              </div>
            </Button>
          </Link>
          <Link to="/members">
            <Button variant="outline" className="w-full justify-start h-auto py-4" size="lg">
              <UsersIcon className="mr-3 h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">{t('viewMembers')}</p>
                <p className="text-xs text-muted-foreground">{t('manageChurchMembers')}</p>
              </div>
            </Button>
          </Link>
          <Link to="/announcements">
            <Button variant="outline" className="w-full justify-start h-auto py-4" size="lg">
              <Bell className="mr-3 h-6 w-6" />
              <div className="text-left">
                <p className="font-semibold">{t('announcements')}</p>
                <p className="text-xs text-muted-foreground">{t('latestChurchUpdates')}</p>
              </div>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
