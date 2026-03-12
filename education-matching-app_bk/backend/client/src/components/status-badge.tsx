import { Badge } from "@/components/ui/badge";

type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "failed"
  | "refunded"
  | "resolved"
  | "student"
  | "teacher"
  | "admin"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "online"
  | "offline";

interface StatusBadgeProps {
  status: StatusType | string;
  testId?: string;
}

const statusConfig: Record<
  StatusType,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  pending: { label: "Pending", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "default" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "outline" },
  resolved: { label: "Resolved", variant: "default" },
  student: { label: "Student", variant: "default" },
  teacher: { label: "Teacher", variant: "secondary" },
  admin: { label: "Admin", variant: "outline" },
  bronze: { label: "Bronze", variant: "outline" },
  silver: { label: "Silver", variant: "secondary" },
  gold: { label: "Gold", variant: "default" },
  platinum: { label: "Platinum", variant: "default" },
  online: { label: "Online", variant: "default" },
  offline: { label: "Offline", variant: "secondary" },
};

export function StatusBadge({ status, testId }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status,
    variant: "outline" as const,
  };

  return (
    <Badge variant={config.variant} data-testid={testId}>
      {config.label}
    </Badge>
  );
}
