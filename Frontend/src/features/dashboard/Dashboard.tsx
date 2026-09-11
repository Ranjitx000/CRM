import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Package, FileText, ArrowUpRight, TrendingUp, Layers } from 'lucide-react';
import { useAuthStore } from '../auth/auth.store';
import { RevenueChart } from './components/RevenueChart';
import { ActivityTimeline } from './components/ActivityTimeline';
import { QuickActions } from './components/QuickActions';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { useChallans } from '@/hooks/useChallans';
import { LoadingState } from '@/components/shared/LoadingState';

export function Dashboard() {
  const { user } = useAuthStore();
  const { data: customersResponse, isLoading: loadingCustomers } = useCustomers();
  const { data: productsResponse, isLoading: loadingProducts } = useProducts();
  const { data: challansResponse, isLoading: loadingChallans } = useChallans();

  if (loadingCustomers || loadingProducts || loadingChallans) {
    return <LoadingState text="Connecting to ERP database..." />;
  }

  const customers = customersResponse?.data || [];
  const products = productsResponse?.data || [];
  const challans = challansResponse?.data || [];

  const totalCustomers = customersResponse?.meta?.total ?? customers.length;
  const totalProducts = productsResponse?.meta?.total ?? products.length;
  const totalChallans = challansResponse?.meta?.total ?? challans.length;
  const totalStockUnits = products.reduce((sum, p) => sum + (p.currentStock || 0), 0);

  const stats = [
    {
      title: 'Total Customers',
      value: totalCustomers.toString(),
      change: 'Active in CRM',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Catalog Products',
      value: totalProducts.toString(),
      change: 'Active SKUs',
      icon: Package,
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      title: 'Total Inventory Stock',
      value: `${totalStockUnits} units`,
      change: 'Physical Stock',
      icon: Layers,
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      title: 'Sales Challans',
      value: totalChallans.toString(),
      change: 'Total Issued',
      icon: FileText,
      color: 'text-accent-foreground',
      bg: 'bg-muted'
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-fade-in-up">
        <PageHeader 
          title={`Welcome back, ${user?.name || 'User'}`} 
          description="Here's what's happening with your business today."
        />
        <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border">
          <TrendingUp className="w-4 h-4 mr-2 text-success" />
          System Status: <strong className="text-foreground ml-1">Live Connected</strong>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
        {stats.map((stat, i) => (
          <Card key={i} className="shadow-soft hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                <p className="text-xs text-muted-foreground flex items-center">
                  <ArrowUpRight className="h-3.5 w-3.5 mr-1 text-success" />
                  <span className="text-success font-medium mr-1">{stat.change}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <QuickActions />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <RevenueChart />
        <ActivityTimeline challans={challans} customers={customers} products={products} />
      </div>
    </div>
  );
}
