
import { AppointmentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  
  const statusClasses = {
    'pending_approval': "bg-yellow-100 text-yellow-800",
    'waiting': "bg-blue-100 text-blue-800",
    'ongoing': "bg-orange-100 text-orange-800",
    'completed': "bg-gray-100 text-gray-800",
    'cancelled': "bg-red-100 text-red-800",
    'no-show': "bg-black-100 text-back-800",
    'confirmed':"bg-green-100 text-green-800",
    'rejected':"bg-brown-100 text-brown-800",
    'approved':"bg-whilte-500 text-black-800"

  };
  
  const displayText = {
    'pending_approval': "Pending",
    'waiting': "Waiting",
    'ongoing': "In Progress",
    'completed': "Completed",
    'cancelled': "Cancelled",
    'no-show':"No-Show",
    'confirmed':"confirmed",
    'approved':'approved',
    'rejected':'rejected'

  };

  return (
    <span className={cn(baseClasses, statusClasses[status], className)}>
      {displayText[status]}
    </span>
  );
}
