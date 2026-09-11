import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Plus, Edit2, MoreHorizontal, Users, Search, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';

const MOCK_USERS = [
  { id: '1', name: 'Admin User', email: 'admin@crm.com', role: 'ADMIN', lastLogin: '2023-10-06' },
  { id: '2', name: 'John Sales', email: 'john@crm.com', role: 'SALES', lastLogin: '2023-10-05' },
  { id: '3', name: 'Jane Accounts', email: 'jane@crm.com', role: 'ACCOUNTS', lastLogin: '2023-10-06' },
  { id: '4', name: 'Bob Warehouse', email: 'bob@crm.com', role: 'WAREHOUSE', lastLogin: '2023-10-04' },
];

export function UsersAdmin() {
  const [search, setSearch] = useState('');

  const filteredUsers = MOCK_USERS.filter((u) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <PageHeader 
          title="User Management" 
          description="Admin access required to manage system users and roles."
        />
        <Sheet>
          <SheetTrigger render={<Button className="shadow-soft animate-hover" />}>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-[400px]">
            <SheetHeader>
              <SheetTitle>Add New User</SheetTitle>
              <SheetDescription>Create a new user and assign a role.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="name">Name</label>
                <Input id="name" placeholder="Full Name" className="bg-muted/50 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
                <Input id="email" type="email" placeholder="user@company.com" className="bg-muted/50 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="role">Role</label>
                <select id="role" className="flex h-9 w-full rounded-md border border-input bg-muted/50 focus:bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="SALES">Sales</option>
                  <option value="ACCOUNTS">Accounts</option>
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <Button type="button" className="mt-4 w-full shadow-soft">Save User</Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Card className="animate-fade-in-up shadow-soft border-border" style={{ animationDelay: '50ms' }}>
        <CardHeader className="pb-3 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">System Accounts</CardTitle>
              <CardDescription>Manage staff roles and access levels.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72 group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search users..." 
                className="pl-9 bg-background focus:bg-background transition-colors" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="p-6">
              <EmptyState 
                icon={Users} 
                title="No users found" 
                description={search ? `No results for "${search}". Try adjusting your filters.` : "You haven't added any users yet."} 
              />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px] pl-6 font-medium">User Details</TableHead>
                  <TableHead className="font-medium">Role</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Last Login</TableHead>
                  <TableHead className="w-[80px] text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="pl-6 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          <span className="text-xs text-muted-foreground font-normal flex items-center mt-0.5">
                            <Mail className="w-3 h-3 mr-1" /> {user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className={`inline-flex items-center gap-1.5 shadow-none border-0 ${
                        user.role === 'ADMIN' ? 'bg-primary/15 text-primary hover:bg-primary/25' : 'bg-muted text-muted-foreground'
                      }`}>
                        {user.role === 'ADMIN' && <ShieldAlert className="h-3.5 w-3.5" />} 
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            Suspend User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
