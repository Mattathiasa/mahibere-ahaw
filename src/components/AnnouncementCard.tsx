import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Calendar, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toDate } from '@/lib/date-utils';

interface AnnouncementCardProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    authorHierarchyLevel: string;
    createdAt: any;
    expiresAt?: any;
  };
  onEdit?: (announcement: any) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const AnnouncementCard = ({ announcement, onEdit, onDelete, className }: AnnouncementCardProps) => {
  const { user } = useAuth();
  const isExpiringSoon = announcement.expiresAt
    ? toDate(announcement.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
    : false;

  const isAuthor = user?.id === announcement.authorId;

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl leading-tight">{announcement.title}</CardTitle>
          <div className="flex items-center gap-2">
            {isExpiringSoon && (
              <Badge variant="destructive" className="text-xs">
                Expiring Soon
              </Badge>
            )}
            {isAuthor && onEdit && onDelete && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(announcement)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(announcement.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{announcement.authorName}</span>
            <Badge variant="outline" className="ml-1 text-xs">
              {announcement.authorHierarchyLevel}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDistanceToNow(toDate(announcement.createdAt), { addSuffix: true })}</span>
          </div>
          {announcement.expiresAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Expires: {format(toDate(announcement.expiresAt), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{announcement.content}</p>
      </CardContent>
    </Card>
  );
};

export default AnnouncementCard;
