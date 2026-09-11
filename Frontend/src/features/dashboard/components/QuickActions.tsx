import { FileText, Users, Package, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const actions = [
  { title: 'Create Challan', icon: FileText, to: '/challans?new=true', color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'Add Customer', icon: Users, to: '/customers?new=true', color: 'text-success', bg: 'bg-success/10' },
  { title: 'Add Product', icon: Package, to: '/products?new=true', color: 'text-warning', bg: 'bg-warning/10' },
  { title: 'User Admin', icon: Settings, to: '/users', color: 'text-muted-foreground', bg: 'bg-muted' },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
      {actions.map((action, i) => (
        <Link key={i} to={action.to}>
          <Card className="hover:border-primary/50 transition-colors shadow-soft hover:shadow-md h-full group">
            <CardContent className="p-4 flex flex-col items-center justify-center gap-3 text-center h-full">
              <div className={`p-3 rounded-full ${action.bg} ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">{action.title}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
