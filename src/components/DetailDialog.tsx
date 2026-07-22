import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  description?: string;
}

export function DetailDialog({ open, onOpenChange, title, subtitle, description }: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          {subtitle && (
            <div className="font-mono-display text-[10px] font-bold text-primary tracking-widest uppercase mb-1">
              {subtitle}
            </div>
          )}
          <DialogTitle className="text-base leading-tight">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-sm text-muted-foreground whitespace-pre-wrap pt-2">
              {description}
            </DialogDescription>
          ) : (
            <DialogDescription className="text-xs text-muted-foreground/70 italic pt-2">
              No description added.
            </DialogDescription>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
