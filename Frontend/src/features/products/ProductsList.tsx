import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, Plus, Edit2, MoreHorizontal, AlertTriangle, Package, Activity } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { useProducts, useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useCreateStockMovement, useProductStockHistory } from '@/hooks/useStock';
import type { Product } from '@/types/product';

const productSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  sku: z.string().min(2, { message: 'SKU is required' }),
  category: z.string().optional(),
  unitPrice: z.coerce.number().min(0),
  minStockAlert: z.coerce.number().min(0),
  warehouseLocation: z.string().optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

const stockSchema = z.object({
  type: z.enum(['IN', 'OUT']),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(2, 'Reason is required'),
});
type StockFormValues = z.infer<typeof stockSchema>;

export function ProductsList() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(() => searchParams.get('new') === 'true');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isStockSheetOpen, setIsStockSheetOpen] = useState(false);
  const [activeStockProduct, setActiveStockProduct] = useState<Product | null>(null);

  const { data: response, isLoading } = useProducts(search ? { search } : undefined);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createStock = useCreateStockMovement();

  // For displaying history inside the stock modal
  const { data: historyRes, isLoading: historyLoading } = useProductStockHistory(activeStockProduct?._id || '');

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', sku: '', category: '', unitPrice: 0, minStockAlert: 0, warehouseLocation: '' }
  });

  const stockForm = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: { type: 'IN', quantity: 1, reason: '' }
  });

  const products: Product[] = response?.data || [];

  const openAddProduct = () => {
    setEditingProduct(null);
    productForm.reset({ name: '', sku: '', category: '', unitPrice: 0, minStockAlert: 0, warehouseLocation: '' });
    setIsProductSheetOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      sku: product.sku,
      category: product.category || '',
      unitPrice: product.unitPrice,
      minStockAlert: product.minStockAlert,
      warehouseLocation: product.warehouseLocation || '',
    });
    setIsProductSheetOpen(true);
  };

  const openManageStock = (product: Product) => {
    setActiveStockProduct(product);
    stockForm.reset({ type: 'IN', quantity: 1, reason: '' });
    setIsStockSheetOpen(true);
  };

  const onProductSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct._id, payload: data }, {
        onSuccess: () => {
          setIsProductSheetOpen(false);
          productForm.reset();
        }
      });
    } else {
      createProduct.mutate(data, {
        onSuccess: () => {
          setIsProductSheetOpen(false);
          productForm.reset();
        }
      });
    }
  };

  const onStockSubmit = (data: StockFormValues) => {
    if (!activeStockProduct) return;
    createStock.mutate({
      productId: activeStockProduct._id,
      quantity: data.quantity,
      type: data.type,
      reason: data.reason
    }, {
      onSuccess: () => {
        setIsStockSheetOpen(false);
        stockForm.reset();
      }
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <PageHeader 
          title="Products & Inventory" 
          description="Manage your product catalog and monitor stock levels."
        />
        <Sheet open={isProductSheetOpen} onOpenChange={setIsProductSheetOpen}>
          <Button className="w-full sm:w-auto shadow-soft animate-hover bg-primary hover:bg-primary/90 text-primary-foreground" onClick={openAddProduct}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
          <SheetContent side="right" className="sm:max-w-[400px] w-[90vw] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</SheetTitle>
              <SheetDescription>Enter product catalog details.</SheetDescription>
            </SheetHeader>
            <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="grid gap-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="sku">SKU</label>
                <Input id="sku" placeholder="PRD-XXXX" className="bg-muted/50 focus:bg-background" {...productForm.register('sku')} disabled={createProduct.isPending || updateProduct.isPending} />
                {productForm.formState.errors.sku && <p className="text-sm text-destructive">{productForm.formState.errors.sku.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="name">Product Name</label>
                <Input id="name" placeholder="Item Name" className="bg-muted/50 focus:bg-background" {...productForm.register('name')} disabled={createProduct.isPending || updateProduct.isPending} />
                {productForm.formState.errors.name && <p className="text-sm text-destructive">{productForm.formState.errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="unitPrice">Unit Price</label>
                  <Input id="unitPrice" type="number" step="0.01" placeholder="0.00" className="bg-muted/50 focus:bg-background" {...productForm.register('unitPrice')} disabled={createProduct.isPending || updateProduct.isPending} />
                  {productForm.formState.errors.unitPrice && <p className="text-sm text-destructive">{productForm.formState.errors.unitPrice.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="minStockAlert">Min Alert</label>
                  <Input id="minStockAlert" type="number" placeholder="0" className="bg-muted/50 focus:bg-background" {...productForm.register('minStockAlert')} disabled={createProduct.isPending || updateProduct.isPending} />
                </div>
              </div>
              <Button type="submit" className="mt-4 w-full shadow-soft" disabled={createProduct.isPending || updateProduct.isPending}>
                {createProduct.isPending || updateProduct.isPending ? 'Saving...' : 'Save Product'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <Sheet open={isStockSheetOpen} onOpenChange={setIsStockSheetOpen}>
        <SheetContent side="right" className="sm:max-w-[400px] w-[90vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Manage Stock - {activeStockProduct?.name}</SheetTitle>
            <SheetDescription>Current Stock: {activeStockProduct?.currentStock}</SheetDescription>
          </SheetHeader>
          <form onSubmit={stockForm.handleSubmit(onStockSubmit)} className="grid gap-4 py-6 border-b border-border mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Type</label>
                <select 
                  {...stockForm.register('type')} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={createStock.isPending}
                >
                  <option value="IN">Stock IN</option>
                  <option value="OUT">Stock OUT</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Quantity</label>
                <Input type="number" min="1" {...stockForm.register('quantity')} disabled={createStock.isPending} />
                {stockForm.formState.errors.quantity && <p className="text-sm text-destructive">{stockForm.formState.errors.quantity.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Reason</label>
              <Input placeholder="e.g. Received shipment" {...stockForm.register('reason')} disabled={createStock.isPending} />
              {stockForm.formState.errors.reason && <p className="text-sm text-destructive">{stockForm.formState.errors.reason.message}</p>}
            </div>
            <Button type="submit" className="mt-2 w-full" disabled={createStock.isPending}>
              {createStock.isPending ? 'Recording...' : 'Record Movement'}
            </Button>
          </form>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Recent History</h4>
            {historyLoading ? <div className="text-sm text-muted-foreground">Loading history...</div> : (
              <div className="space-y-3">
                {historyRes?.data?.length === 0 && <div className="text-sm text-muted-foreground">No stock history yet.</div>}
                {historyRes?.data?.map((mov: any) => (
                  <div key={mov._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-sm border p-2 rounded">
                    <div>
                      <Badge variant={mov.type === 'IN' ? 'default' : 'secondary'} className={mov.type === 'IN' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}>{mov.type}</Badge>
                      <span className="ml-2 font-medium">{mov.quantity} units</span>
                    </div>
                    <div className="text-muted-foreground text-xs">{new Date(mov.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Card className="animate-fade-in-up shadow-soft border-border" style={{ animationDelay: '50ms' }}>
        <CardHeader className="pb-3 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Inventory Master</CardTitle>
              <CardDescription>View and manage product catalog and current stock levels.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search by name or SKU..." 
                className="pl-9 bg-background focus:bg-background transition-colors" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState text="Loading products..." />
          ) : products.length === 0 ? (
            <div className="p-6">
              <EmptyState 
                icon={Package} 
                title="No products found" 
                description={search ? `No results for "${search}". Try adjusting your filters.` : "You haven't added any products to the inventory yet."} 
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px] pl-6 font-medium">SKU</TableHead>
                    <TableHead className="font-medium whitespace-nowrap">Product Details</TableHead>
                    <TableHead className="text-right font-medium whitespace-nowrap">Unit Price</TableHead>
                    <TableHead className="text-right font-medium whitespace-nowrap">Current Stock</TableHead>
                    <TableHead className="text-center font-medium whitespace-nowrap">Status</TableHead>
                    <TableHead className="w-[80px] text-right pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const isLowStock = product.currentStock < product.minStockAlert;
                    return (
                      <TableRow key={product._id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell className="pl-6 font-medium text-muted-foreground whitespace-nowrap">{product.sku}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                              <Package className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">${product.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          <span className={isLowStock ? 'text-destructive' : ''}>
                            {product.currentStock || 0}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">/ {product.minStockAlert || 0}</span>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          {isLowStock ? (
                            <Badge variant="destructive" className="bg-destructive/15 text-destructive hover:bg-destructive/25 border-0 inline-flex items-center gap-1 shadow-none">
                              <AlertTriangle className="h-3 w-3" /> Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-success/15 text-success hover:bg-success/25 border-0 shadow-none">
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity focus:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openManageStock(product)}>
                                <Activity className="mr-2 h-4 w-4" /> Manage Stock
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditProduct(product)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Edit Details
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
