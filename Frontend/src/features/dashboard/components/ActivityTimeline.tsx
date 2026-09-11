import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package, FileText, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Challan } from '@/types/challan';
import type { Customer } from '@/types/customer';
import type { Product } from '@/types/product';

interface ActivityTimelineProps {
  challans?: Challan[];
  customers?: Customer[];
  products?: Product[];
}

export function ActivityTimeline({ challans = [], customers = [], products = [] }: ActivityTimelineProps) {
  const activities: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    icon: any;
    iconBg: string;
    iconColor: string;
    date: Date;
  }> = [];

  challans.forEach((c) => {
    activities.push({
      id: `challan-${c._id}`,
      title: `Challan #${c.challanNumber}`,
      description: `Status: ${c.status} (${c.totalQuantity} items)`,
      time: new Date(c.createdAt).toLocaleDateString(),
      icon: FileText,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      date: new Date(c.createdAt),
    });
  });

  customers.forEach((cust) => {
    activities.push({
      id: `customer-${cust._id}`,
      title: `Customer Registered`,
      description: `${cust.name} (${cust.type})`,
      time: new Date(cust.createdAt).toLocaleDateString(),
      icon: UserPlus,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      date: new Date(cust.createdAt),
    });
  });

  products.forEach((p) => {
    activities.push({
      id: `product-${p._id}`,
      title: `Product Added`,
      description: `${p.name} (Stock: ${p.currentStock})`,
      time: new Date(p.createdAt).toLocaleDateString(),
      icon: Package,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      date: new Date(p.createdAt),
    });
  });

  activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  const displayActivities = activities.slice(0, 5);

  return (
    <Card className="lg:col-span-3 md:col-span-2 shadow-soft animate-fade-in-up border-border" style={{ animationDelay: '100ms' }}>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Latest live actions across your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        {displayActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent activity recorded yet.</p>
        ) : (
          <div className="relative border-l border-muted ml-3 space-y-6 pb-2">
            {displayActivities.map((activity) => (
              <div key={activity.id} className="relative pl-6">
                <div className={cn(
                  "absolute -left-3.5 top-0.5 h-7 w-7 rounded-full flex items-center justify-center ring-4 ring-background",
                  activity.iconBg, activity.iconColor
                )}>
                  <activity.icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
