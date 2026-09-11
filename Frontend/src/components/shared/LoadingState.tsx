import { Loader2 } from 'lucide-react';

export function LoadingState({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full text-muted-foreground animate-pulse">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}
