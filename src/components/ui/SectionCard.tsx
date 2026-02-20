import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const SectionCard = ({
  title,
  description,
  icon: Icon,
  children,
  action,
  className = '',
}: SectionCardProps) => {
  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {Icon && (
              <div className="p-2 rounded-lg bg-primary/10 mt-1">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
