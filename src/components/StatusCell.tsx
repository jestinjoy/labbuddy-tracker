import { motion } from 'framer-motion';
import { ExperimentStatus, nextStatus } from '@/lib/types';
import { Check, Send, Clock } from 'lucide-react';

interface StatusCellProps {
  status: ExperimentStatus;
  onToggle: () => void;
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

export function StatusCell({ status, onToggle }: StatusCellProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.button
      onClick={onToggle}
      className={`w-14 h-14 flex items-center justify-center border-2 rounded cell-transition ${config.className}`}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      title={`Status: ${status}. Tap to change to ${nextStatus(status)}`}
    >
      <Icon size={20} strokeWidth={2.5} />
    </motion.button>
  );
}
