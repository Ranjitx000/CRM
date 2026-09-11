import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType = 'Confirmed' | 'Active' | 'Draft' | 'Lead' | 'Low-stock' | 'Cancelled' | 'Inactive' | 'Out-of-stock' | 'Neutral';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusVariants: Record<StatusType, string> = {
  Confirmed: 'bg-green-100 text-green-800 hover:bg-green-100/80',
  Active: 'bg-green-100 text-green-800 hover:bg-green-100/80',
  Draft: 'bg-amber-100 text-amber-800 hover:bg-amber-100/80',
  Lead: 'bg-amber-100 text-amber-800 hover:bg-amber-100/80',
  'Low-stock': 'bg-amber-100 text-amber-800 hover:bg-amber-100/80',
  Cancelled: 'bg-red-100 text-red-800 hover:bg-red-100/80',
  Inactive: 'bg-red-100 text-red-800 hover:bg-red-100/80',
  'Out-of-stock': 'bg-red-100 text-red-800 hover:bg-red-100/80',
  Neutral: 'bg-slate-100 text-slate-800 hover:bg-slate-100/80',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge className={cn('border-transparent font-medium', statusVariants[status] || statusVariants.Neutral, className)} variant="outline">
      {status}
    </Badge>
  );
}
