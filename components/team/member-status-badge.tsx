"use client";

import { Badge } from "@/components/ui/badge";

type MemberStatus = "active" | "inactive" | "pending";

interface MemberStatusBadgeProps {
  status: MemberStatus;
}

export default function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  const getStatusConfig = (status: MemberStatus) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          className: "bg-green-100 text-green-700 border-green-200",
        };
      case "inactive":
        return {
          label: "Inactive",
          className: "bg-slate-100 text-slate-700 border-slate-200",
        };
      case "pending":
        return {
          label: "Pending",
          className: "bg-amber-100 text-amber-700 border-amber-200",
        };
      default:
        return {
          label: "Unknown",
          className: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge className={`${config.className} border`} variant="outline">
      {config.label}
    </Badge>
  );
}