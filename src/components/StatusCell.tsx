import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ExperimentStatus, nextStatus } from '@/lib/types';
import { Check, Send, Clock } from 'lucide-react';
import { StatusEditDialog } from './StatusEditDialog';

interface StatusCellProps {
  status: ExperimentStatus;
  onToggle: () => void;
  onManualEdit?: (data: { status: ExperimentStatus; completedAt?: string; submittedAt?: string }) => void;
  updatedAt?: string;
  completedAt?: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    className: 'border-status-pending text-status-pending bg-transparent',
  },
  completed: {
    icon: Check,
    className: 'border-status-completed text-status-completed bg-status-completed/15',
  },
  submitted: {
    icon: Send,
    className: 'border-status-submitted text-status-submitted bg-status-submitted/15',
  },
};

function formatShortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function StatusCell({ status, onToggle, onManualEdit, updatedAt, completedAt }: StatusCellProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const dateStr = formatShortDate(updatedAt);
  const [dialogOpen, setDialogOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handlePointerDown = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setDialogOpen(true);
    }, 500);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!didLongPress.current) {
      onToggle();
    }
  }, [onToggle]);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <>
      <motion.button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onContextMenu={e => { e.preventDefault(); setDialogOpen(true); }}
        className={`w-14 h-14 flex flex-col items-center justify-center border-2 rounded cell-transition ${config.className}`}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        title={`Status: ${status}. Tap to change, long-press to edit dates.`}
      >
        <Icon size={18} strokeWidth={2.5} />
        {dateStr && status !== 'pending' && (
          <span className="text-[7px] leading-none mt-0.5 opacity-70 font-mono-display">{dateStr}</span>
        )}
      </motion.button>
      {onManualEdit && (
        <StatusEditDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          status={status}
          completedAt={completedAt}
          submittedAt={status === 'submitted' ? updatedAt : undefined}
          onSave={onManualEdit}
        />
      )}
    </>
  );
}
