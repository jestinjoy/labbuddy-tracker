import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExperimentStatus } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StatusEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ExperimentStatus;
  completedAt?: string;
  submittedAt?: string;
  onSave: (data: { status: ExperimentStatus; completedAt?: string; submittedAt?: string }) => void;
}

export function StatusEditDialog({ open, onOpenChange, status, completedAt, submittedAt, onSave }: StatusEditDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<ExperimentStatus>(status);
  const [compDate, setCompDate] = useState<Date | undefined>(completedAt ? new Date(completedAt) : undefined);
  const [subDate, setSubDate] = useState<Date | undefined>(submittedAt ? new Date(submittedAt) : undefined);

  const handleSave = () => {
    onSave({
      status: selectedStatus,
      completedAt: selectedStatus !== 'pending' && compDate ? compDate.toISOString() : undefined,
      submittedAt: selectedStatus === 'submitted' && subDate ? subDate.toISOString() : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">Edit Status & Dates</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Status</label>
            <div className="flex gap-2">
              {(['pending', 'completed', 'submitted'] as ExperimentStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={cn(
                    'px-3 py-1.5 rounded text-xs border capitalize cell-transition',
                    selectedStatus === s
                      ? s === 'pending' ? 'border-status-pending bg-status-pending/10 text-status-pending'
                        : s === 'completed' ? 'border-status-completed bg-status-completed/10 text-status-completed'
                        : 'border-status-submitted bg-status-submitted/10 text-status-submitted'
                      : 'border-border text-muted-foreground'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {selectedStatus !== 'pending' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Completed Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left text-xs h-9', !compDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {compDate ? format(compDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={compDate} onSelect={setCompDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {selectedStatus === 'submitted' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Submitted Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left text-xs h-9', !subDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {subDate ? format(subDate, 'PPP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={subDate} onSelect={setSubDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <Button onClick={handleSave} className="w-full text-xs h-9">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
