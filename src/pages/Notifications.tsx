import { useState } from 'react';
import { Bell, Check, Trash2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notifications';
import { Notification } from '@/types';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { toDate } from '@/lib/date-utils';

export default function Notifications() {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');

  // Get notifications based on active tab
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', activeTab],
    queryFn: () => notificationService.getNotifications({
      status: activeTab === 'all' ? undefined : activeTab,
      limit: 50
    }),
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success(t('allNotificationsRead'));
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success(t('notificationDeleted'));
    },
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n: Notification) => n.status === 'unread').length;

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'plan_created':
      case 'plan_updated':
        return '📋';
      case 'report_submitted':
      case 'report_comment':
        return '📊';
      case 'financial_report_generated':
      case 'budget_created':
      case 'transaction_recorded':
        return '💰';
      case 'document_shared':
        return '📄';
      case 'meeting_scheduled':
        return '📅';
      case 'announcement_posted':
        return '📢';
      default:
        return '🔔';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('notifications')}</h1>
          <p className="text-muted-foreground">{t('stayUpdated')}</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">{t('loadingNotifications')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('notifications')}</h1>
          <p className="text-muted-foreground">{t('stayUpdated')}</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} disabled={markAllAsReadMutation.isPending}>
            <Check className="mr-2 h-4 w-4" />
            {t('markAllRead')} ({unreadCount})
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="all">{t('all')}</TabsTrigger>
          <TabsTrigger value="unread">
            {t('unread')} {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="read">{t('read')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('noNotifications')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification: Notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all hover:shadow-md ${notification.status === 'unread' ? 'border-l-4 border-l-primary bg-primary/5' : ''
                    }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {language === 'am' ? notification.titleAmharic : notification.title}
                          </CardTitle>
                          <p className="text-muted-foreground mt-1">
                            {language === 'am' ? notification.messageAmharic : notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span>{t('from')}: {notification.senderName}</span>
                            <span>{formatDistanceToNow(toDate(notification.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {notification.status === 'unread' && (
                          <Badge variant="secondary">{t('new')}</Badge>
                        )}
                        <div className="flex gap-1">
                          {notification.status === 'unread' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                            disabled={deleteNotificationMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {notification.attachments && notification.attachments.length > 0 && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Archive className="h-4 w-4" />
                        <span>{notification.attachments.length} attachment{notification.attachments.length > 1 ? 's' : ''}</span>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}