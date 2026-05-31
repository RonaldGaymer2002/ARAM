import { Card, CardBody } from './ui/card';
import { Skeleton } from './ui/skeleton';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  color?: 'green' | 'blue' | 'yellow' | 'purple';
  loading?: boolean;
}

const colorMap = {
  green:  { bg: 'bg-green-light',  icon: 'bg-green-primary text-white' },
  blue:   { bg: 'bg-[#EBF4FF]',     icon: 'bg-[#066AAB] text-white' },
  yellow: { bg: 'bg-warning-light',   icon: 'bg-warning-amber text-white' },
  purple: { bg: 'bg-purple-50',   icon: 'bg-purple-600 text-white' },
};

export function MetricCard({ label, value, sub, icon: Icon, color = 'green', loading }: MetricCardProps) {
  const c = colorMap[color];
  if (loading) return (
    <Card className={c.bg}>
      <CardBody className="flex gap-4 items-center">
        <Skeleton className="w-12 h-12 rounded-[10px]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </CardBody>
    </Card>
  );

  return (
    <Card className={`border-none ${c.bg} shadow-none`}>
      <CardBody className="flex gap-4 items-center">
        <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center flex-shrink-0 ${c.icon}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-body-text">{label}</p>
          <p className="text-2xl font-black text-black-heading tracking-tight">{value}</p>
          {sub && <p className="text-xs font-semibold text-body-text mt-0.5">{sub}</p>}
        </div>
      </CardBody>
    </Card>
  );
}
