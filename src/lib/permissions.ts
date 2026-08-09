export type AppRole = "ATTENDANT" | "MANAGER" | "OWNER";

const ROLE_PATHS: Record<AppRole, string[]> = {
  ATTENDANT: ["/dashboard", "/pos", "/products"],
  MANAGER: [
    "/dashboard",
    "/pos",
    "/products",
    "/purchases",
    "/suppliers",
    "/expenses",
    "/reports",
    "/staff",
  ],
  OWNER: [
    "/dashboard",
    "/pos",
    "/products",
    "/purchases",
    "/suppliers",
    "/expenses",
    "/reports",
    "/staff",
    "/settings",
  ],
};

export function canAccess(role: AppRole | string, path: string): boolean {
  const allowed = ROLE_PATHS[role as AppRole];
  if (!allowed) return false;
  const base = path.split("?")[0].replace(/\/$/, "") || "/";
  return allowed.some((p) => base === p || base.startsWith(`${p}/`));
}

export function pathsForRole(role: AppRole | string): string[] {
  return ROLE_PATHS[role as AppRole] ?? [];
}

export function defaultPathForRole(role: AppRole | string): string {
  if (role === "ATTENDANT") return "/pos";
  return "/dashboard";
}

export function roleLabel(role: AppRole | string): string {
  switch (role) {
    case "ATTENDANT":
      return "Store Attendant";
    case "MANAGER":
      return "Store Manager";
    case "OWNER":
      return "Store Owner";
    default:
      return role;
  }
}
