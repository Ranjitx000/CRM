import { Bell, Search, Menu, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/80 backdrop-blur-md border-b border-border px-4 sm:px-6">
      <Sheet>
        <SheetTrigger render={<Button variant="outline" size="icon" className="md:hidden shrink-0" />}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-4 lg:gap-6">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
              type="search"
              placeholder="Search anything..."
              className="pl-9 h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background sm:w-[300px] md:w-[240px] lg:w-[320px]"
            />
            <div className="absolute right-2.5 top-2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </form>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
            <span className="sr-only">Toggle notifications</span>
          </Button>
          
          <div className="hidden sm:block h-5 w-[1px] bg-border mx-1" />
          
          <Button size="sm" className="hidden sm:flex gap-1.5 h-9 animate-hover shadow-soft">
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
