import { roleLabel, type AppRole } from "@/lib/permissions";

const STYLES: Record<AppRole, string> = {
  ATTENDANT: "bg-mint text-forest border-border",
  MANAGER: "bg-gold-soft text-charcoal border-[#e6d7a0]",
  OWNER: "bg-forest text-white border-forest-dark",
};

type RoleBadgeProps = {
  role: AppRole | string;
  className?: string;
};

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const style = STYLES[role as AppRole] ?? "bg-mint text-charcoal border-border";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {roleLabel(role)}
    </span>
  );
}
