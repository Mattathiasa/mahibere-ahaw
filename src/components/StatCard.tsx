import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  bgColor?: string;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'text-primary',
  bgColor = 'bg-primary/10',
}: StatCardProps) => {
  return (
    <Card className="hover:shadow-xl transition-all duration-300 animate-scale-in border-[#2E5E99]/10 bg-white/60 dark:bg-[#0D2440]/60 backdrop-blur-sm group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#2E5E99]/5 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500" />

      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className={`p-3 rounded-xl transition-all group-hover:scale-110 ${bgColor || 'bg-[#2E5E99]/10'}`}>
          <Icon className={`h-5 w-5 ${color || 'text-[#2E5E99]'}`} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-end justify-between mt-2">
          <div className="text-4xl font-black tracking-tight text-foreground">{value}</div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend.isPositive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
