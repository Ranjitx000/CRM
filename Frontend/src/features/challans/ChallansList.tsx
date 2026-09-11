import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, FileText, Printer, MoreHorizontal, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';

import { useChallans, useCreateChallan, useUpdateChallan } from '@/hooks/useChallans';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import type { Challan } from '@/types/challan';

const challanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1')
  })).min(1, 'At least one item is required')
});

type ChallanFormValues = z.infer<typeof challanSchema>;

export function ChallansList() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(() => searchParams.get('new') === 'true');

  // Queries
  const { data: challansResponse, isLoading: isLoadingChallans } = useChallans();
  const { data: customersResponse, isLoading: isLoadingCustomers } = useCustomers();
  const { data: productsResponse, isLoading: isLoadingProducts } = useProducts();

  // Mutations
  const createChallan = useCreateChallan();
  const updateChallan = useUpdateChallan();

  const challans: Challan[] = challansResponse?.data || [];
  const customers = customersResponse?.data || [];
  const products = productsResponse?.data || [];

  const form = useForm<ChallanFormValues>({
    resolver: zodResolver(challanSchema),
    defaultValues: { customerId: '', items: [{ productId: '', quantity: 1 }] }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

  const filteredChallans = useMemo(() => {
    return challans.filter((c) => {
      const customerName = customers.find((cust: any) => cust._id === c.customerId)?.name || '';
      return customerName.toLowerCase().includes(search.toLowerCase()) || 
             c.challanNumber.toLowerCase().includes(search.toLowerCase());
    });
  }, [challans, customers, search]);

  const onSubmit = (data: ChallanFormValues) => {
    createChallan.mutate(data, {
      onSuccess: () => {
        setIsSheetOpen(false);
        form.reset();
      }
    });
  };

  const handleUpdateStatus = (id: string, status: 'CONFIRMED' | 'CANCELLED') => {
    updateChallan.mutate({ id, payload: { status } });
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <PageHeader 
          title="Sales Challans" 
          description="View and manage delivery challans and their statuses."
        />
                  <Button className="w-full sm:w-auto shadow-soft animate-hover bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Challan
        </Button>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-[500px] w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create New Challan</SheetTitle>
            <SheetDescription>Select a customer and add products to the challan.</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Customer</label>
              <select 
                {...form.register('customerId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                disabled={isLoadingCustomers || createChallan.isPending}
              >
                <option value="">Select a customer...</option>
                {customers.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {form.formState.errors.customerId && <p className="text-sm text-destructive">{form.formState.errors.customerId.message}</p>}
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Items</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1 })}>
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-muted/20 p-3 rounded-md border border-border/50">
                  <div className="flex-1 space-y-3 sm:space-y-0 sm:flex sm:gap-3 w-full">
                    <div className="flex-1">
                      <select
                        {...form.register(`items.${index}.productId` as const)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                        disabled={isLoadingProducts || createChallan.isPending}
                      >
                        <option value="">Select product...</option>
                        {products.map((p: any) => (
                          <option key={p._id} value={p._id}>{p.name} (Stock: {p.currentStock})</option>
                        ))}
                      </select>
                      {form.formState.errors.items?.[index]?.productId && (
                        <p className="text-xs text-destructive mt-1">{form.formState.errors.items[index]?.productId?.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-muted-foreground w-auto sm:w-16">Qty:</label>
                      <Input
                        type="number"
                        className="h-8 w-full sm:w-24"
                        min="1"
                        {...form.register(`items.${index}.quantity` as const)}
                        disabled={createChallan.isPending}
                      />
                    </div>
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-full sm:w-8 text-destructive mt-2 sm:mt-0 bg-destructive/10 sm:bg-transparent" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
                      <span className="sm:hidden">Remove Item</span>
                    </Button>
                  )}
                </div>
              ))}
              {form.formState.errors.items && !Array.isArray(form.formState.errors.items) && (
                 <p className="text-sm text-destructive">{form.formState.errors.items.message}</p>
              )}
            </div>

            <Button type="submit" className="mt-6 w-full" disabled={createChallan.isPending}>
              {createChallan.isPending ? 'Creating...' : 'Create Challan'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      <Card className="animate-fade-in-up shadow-soft border-border" style={{ animationDelay: '50ms' }}>
        <CardHeader className="pb-3 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Challan Records</CardTitle>
              <CardDescription>A complete log of all sales and delivery challans.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search by customer or CH#..." 
                className="pl-9 bg-background focus:bg-background transition-colors" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingChallans ? (
            <LoadingState text="Loading challans..." />
          ) : filteredChallans.length === 0 ? (
            <div className="p-6">
              <EmptyState 
                icon={FileText} 
                title="No challans found" 
                description={search ? `No results for "${search}". Try adjusting your filters.` : "You haven't created any challans yet."} 
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[180px] pl-6 font-medium">Challan No</TableHead>
                    <TableHead className="font-medium whitespace-nowrap">Customer</TableHead>
                    <TableHead className="font-medium text-muted-foreground whitespace-nowrap">Date</TableHead>
                    <TableHead className="text-right font-medium whitespace-nowrap">Total Amount</TableHead>
                    <TableHead className="text-center font-medium whitespace-nowrap">Status</TableHead>
                    <TableHead className="w-[80px] text-right pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChallans.map((challan) => {
                    let badgeStyles = "bg-muted text-muted-foreground border-0";
                    
                    if (challan.status === 'CONFIRMED') {
                      badgeStyles = "bg-success/15 text-success hover:bg-success/25 border-0 shadow-none";
                    } else if (challan.status === 'DRAFT') {
                      badgeStyles = "bg-warning/15 text-warning hover:bg-warning/25 border-0 shadow-none";
                    } else if (challan.status === 'CANCELLED') {
                      badgeStyles = "bg-destructive/15 text-destructive hover:bg-destructive/25 border-0 shadow-none";
                    }

                    const customerName = customers.find((c: any) => c._id === challan.customerId)?.name || challan.customerId;
                    const totalAmount = challan.items.reduce((acc, item) => acc + (Number(item.unitPriceSnapshot) * item.quantity), 0);
                    const formattedDate = new Date(challan.createdAt).toLocaleDateString();

                    return (
                      <TableRow key={challan._id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell className="pl-6 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary/70" />
                            <span>{challan.challanNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{customerName}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{formattedDate}</TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          ${totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge variant="outline" className={badgeStyles}>
                            {challan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity focus:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {challan.status === 'DRAFT' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(challan._id, 'CONFIRMED')}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-success" /> Confirm Challan
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(challan._id, 'CANCELLED')}>
                                    <XCircle className="mr-2 h-4 w-4 text-destructive" /> Cancel Challan
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => {
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {
                                  printWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>Delivery Challan - ${challan.challanNumber}</title>
                                        <style>
                                          body { font-family: system-ui, sans-serif; padding: 40px; color: #333; }
                                          .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
                                          .meta { display: flex; justify-content: space-between; margin-bottom: 40px; }
                                          .meta div { flex: 1; }
                                          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                                          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                          th { background-color: #f9fafb; font-weight: 600; }
                                          .text-right { text-align: right; }
                                          .total { font-weight: bold; font-size: 1.2em; text-align: right; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="header">
                                          <h1>DELIVERY CHALLAN</h1>
                                          <p style="color: #666;">Document No: ${challan.challanNumber}</p>
                                        </div>
                                        <div class="meta">
                                          <div>
                                            <strong>Bill To:</strong><br/>
                                            ${(challan.customerId as any)?.name || 'Walk-in Customer'}<br/>
                                            ${(challan.customerId as any)?.email ? (challan.customerId as any).email + '<br/>' : ''}
                                            ${(challan.customerId as any)?.mobile || ''}
                                          </div>
                                          <div class="text-right">
                                            <strong>Date:</strong> ${new Date(challan.createdAt).toLocaleDateString()}<br/>
                                            <strong>Status:</strong> ${challan.status}
                                          </div>
                                        </div>
                                        <table>
                                          <thead>
                                            <tr>
                                              <th>Item</th>
                                              <th>SKU</th>
                                              <th class="text-right">Qty</th>
                                              <th class="text-right">Rate</th>
                                              <th class="text-right">Amount</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            ${challan.items.map((item: any) => `
                                              <tr>
                                                <td>${item.productName || item.productId?.name || 'Item'}</td>
                                                <td>${item.productSku || item.productId?.sku || '-'}</td>
                                                <td class="text-right">${item.quantity}</td>
                                                <td class="text-right">$${(item.unitPrice || 0).toFixed(2)}</td>
                                                <td class="text-right">$${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</td>
                                              </tr>
                                            `).join('')}
                                          </tbody>
                                        </table>
                                        <div class="total">
                                          Total Amount: $${challan.items.reduce((acc: number, item: any) => acc + ((item.quantity || 0) * (item.unitPrice || 0)), 0).toFixed(2)}
                                        </div>
                                        <div style="margin-top: 80px; display: flex; justify-content: space-between;">
                                          <div>_______________________<br/>Authorized Signatory</div>
                                          <div>_______________________<br/>Receiver's Signature</div>
                                        </div>
                                        <script>
                                          window.onload = () => { window.print(); window.close(); }
                                        </script>
                                      </body>
                                    </html>
                                  `);
                                  printWindow.document.close();
                                }
                              }}>
                                <Printer className="mr-2 h-4 w-4 text-muted-foreground" /> Print PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
