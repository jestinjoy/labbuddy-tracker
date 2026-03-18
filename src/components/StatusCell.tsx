import { motion } from 'framer-motion';
import { ExperimentStatus, nextStatus } from '@/lib/types';
import { Check, Send, Clock } from 'lucide-react';

interface StatusCellProps {
  status: ExperimentStatus;
  onToggle: () => void;
  updatedAt?: string;
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

export function StatusCell({ status, onToggle, updatedAt }: StatusCellProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const dateStr = formatShortDate(updatedAt);

  return (
    <motion.button
      onClick={onToggle}
      className={`w-14 h-14 flex flex-col items-center justify-center border-2 rounded cell-transition ${config.className}`}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      title={`Status: ${status}${updatedAt ? ` (${new Date(updatedAt).toLocaleDateString()})` : ''}. Tap to change to ${nextStatus(status)}`}
    >
      <Icon size={18} strokeWidth={2.5} />
      {dateStr && status !== 'pending' && (
        <span className="text-[7px] leading-none mt-0.5 opacity-70 font-mono-display">{dateStr}</span>
      )}
    </motion.button>
  );
}
