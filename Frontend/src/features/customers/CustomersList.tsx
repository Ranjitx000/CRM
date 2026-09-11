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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Plus, Edit2, Users, Mail, Phone } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useCustomerNotes, useAddCustomerNote } from '@/hooks/useCustomers';
import type { Customer, CustomerType } from '@/types/customer';

const customerSchema = z.object({
  name: z.string().min(2, { message: 'Name is required' }),
  mobile: z.string().min(10, { message: 'Mobile is required' }),
  email: z.string().email().optional().or(z.literal('')),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

function CustomerNotes({ customerId }: { customerId: string }) {
  const { data: response, isLoading } = useCustomerNotes(customerId);
  const addNote = useAddCustomerNote();
  const [noteText, setNoteText] = useState('');

  const notes = response?.data || [];

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote.mutate({ id: customerId, note: noteText }, {
      onSuccess: () => setNoteText('')
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Follow-up Notes</h3>
      
      <div className="flex gap-2">
        <Input 
          value={noteText} 
          onChange={e => setNoteText(e.target.value)} 
          placeholder="Add a new note..."
          disabled={addNote.isPending}
          className="text-sm"
        />
        <Button size="sm" onClick={handleAddNote} disabled={addNote.isPending || !noteText.trim()}>
          {addNote.isPending ? 'Adding...' : 'Add'}
        </Button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No notes added yet.</p>
        ) : (
          notes.map((note: any) => (
            <div key={note._id} className="bg-muted/50 p-3 rounded-md text-sm space-y-1">
              <p className="text-foreground">{note.note}</p>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                <span>{note.createdBy?.name || 'Unknown User'}</span>
                <span>{new Date(note.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function CustomersList() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(() => searchParams.get('new') === 'true');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const { data: response, isLoading } = useCustomers(search ? { search } : undefined);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      type: 'RETAIL',
    },
  });

  const customers: Customer[] = response?.data || [];

  const openAdd = () => {
    setEditingCustomer(null);
    reset({ name: '', mobile: '', email: '', type: 'RETAIL' });
    setIsSheetOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || '',
      type: customer.type,
    });
    setIsSheetOpen(true);
  };

  const onSubmit = (data: CustomerFormValues) => {
    const payload = { ...data, email: data.email || undefined };
    
    if (editingCustomer) {
      updateCustomer.mutate({ id: editingCustomer._id, payload }, {
        onSuccess: () => {
          setIsSheetOpen(false);
          reset();
        }
      });
    } else {
      createCustomer.mutate(payload, {
        onSuccess: () => {
          setIsSheetOpen(false);
          reset();
        }
      });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <PageHeader 
          title="Customers" 
          description="Manage your customer relationships and accounts."
        />
        <Button className="w-full sm:w-auto shadow-soft animate-hover" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="right" className="sm:max-w-[400px] w-[90vw] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</SheetTitle>
              <SheetDescription>Enter customer details here. Click save when you're done.</SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="name">Name</label>
                <Input id="name" placeholder="Company Name" className="bg-muted/50 focus:bg-background" {...register('name')} disabled={createCustomer.isPending} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
                <Input id="email" type="email" placeholder="contact@company.com" className="bg-muted/50 focus:bg-background" {...register('email')} disabled={createCustomer.isPending} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="mobile">Mobile</label>
                <Input id="mobile" placeholder="555-0000" className="bg-muted/50 focus:bg-background" {...register('mobile')} disabled={createCustomer.isPending} />
                {errors.mobile && <p className="text-sm text-destructive">{errors.mobile.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="type">Type</label>
                <select 
                  id="type"
                  {...register('type')} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={createCustomer.isPending}
                >
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                </select>
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>
              <Button type="submit" className="mt-4 w-full shadow-soft" disabled={createCustomer.isPending || updateCustomer.isPending}>
                {createCustomer.isPending || updateCustomer.isPending ? 'Saving...' : 'Save Customer'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>

        {/* View Customer Details Sheet */}
        <Sheet open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
          <SheetContent side="right" className="sm:max-w-[450px] w-[90vw] overflow-y-auto">
            {viewingCustomer && (
              <>
                <SheetHeader className="mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-lg uppercase">
                      {viewingCustomer.name.substring(0, 2)}
                    </div>
                    <div>
                      <SheetTitle className="text-xl">{viewingCustomer.name}</SheetTitle>
                      <SheetDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{viewingCustomer.type}</Badge>
                        <Badge variant={viewingCustomer.status === 'ACTIVE' ? 'default' : 'secondary'} className={
                          viewingCustomer.status === 'ACTIVE' 
                            ? 'bg-success/15 text-success border-0 text-[10px]' 
                            : 'bg-muted text-muted-foreground border-0 text-[10px]'
                        }>
                          {viewingCustomer.status}
                        </Badge>
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className="grid gap-6">
                  <div className="grid gap-3 p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground border-b pb-2">Contact Details</h4>
                    <div className="grid grid-cols-[20px_1fr] items-start gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium text-foreground">{viewingCustomer.email || 'No email provided'}</div>
                        <div className="text-xs text-muted-foreground">Primary Email</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-[20px_1fr] items-start gap-3 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium text-foreground">{viewingCustomer.mobile}</div>
                        <div className="text-xs text-muted-foreground">Mobile Phone</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-foreground border-b pb-2">Business Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Business Name</div>
                        <div className="font-medium">{viewingCustomer.businessName || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">GST Number</div>
                        <div className="font-medium">{viewingCustomer.gstNumber || '-'}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground mb-1">Address</div>
                        <div className="font-medium">{viewingCustomer.address || '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Added On</div>
                        <div className="font-medium">{new Date(viewingCustomer.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Follow Up Date</div>
                        <div className="font-medium">{viewingCustomer.followUpDate ? new Date(viewingCustomer.followUpDate).toLocaleDateString() : '-'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <CustomerNotes customerId={viewingCustomer._id} />
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>

      <Card className="animate-fade-in-up shadow-soft border-border" style={{ animationDelay: '50ms' }}>
        <CardHeader className="pb-3 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">Customer Directory</CardTitle>
              <CardDescription>A list of all registered customers in the system.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search by name, email..." 
                className="pl-9 bg-background focus:bg-background transition-colors" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState text="Loading customers..." />
          ) : customers.length === 0 ? (
            <div className="p-6">
              <EmptyState 
                icon={Users} 
                title="No customers found" 
                description={search ? `No results for "${search}". Try adjusting your filters.` : "You haven't added any customers yet."} 
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[300px] pl-6 font-medium whitespace-nowrap">Company Name</TableHead>
                    <TableHead className="font-medium whitespace-nowrap">Contact Details</TableHead>
                    <TableHead className="font-medium whitespace-nowrap">Type & Status</TableHead>
                    <TableHead className="w-[80px] text-right pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow 
                      key={customer._id} 
                      className="group hover:bg-muted/50 transition-colors cursor-pointer" 
                      onClick={() => setViewingCustomer(customer)}
                    >
                      <TableCell className="pl-6 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                            {customer.name.substring(0, 2)}
                          </div>
                          {customer.name}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col gap-1 text-sm">
                          {customer.email && (
                            <div className="flex items-center text-muted-foreground">
                              <Mail className="w-3.5 h-3.5 mr-2 shrink-0" />
                              {customer.email}
                            </div>
                          )}
                          <div className="flex items-center text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 mr-2 shrink-0" />
                            {customer.mobile}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {customer.type}
                          </Badge>
                          <Badge variant={customer.status === 'ACTIVE' ? 'default' : 'secondary'} className={
                            customer.status === 'ACTIVE' 
                              ? 'bg-success/15 text-success hover:bg-success/25 border-0 text-xs' 
                              : 'bg-muted text-muted-foreground border-0 text-xs'
                          }>
                            {customer.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity focus:opacity-100" 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(customer);
                          }}
                        >
                          <span className="sr-only">Edit</span>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
