export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ["*"], // Wildcard handled in checker

  DIRECTOR: [
    "inventory:view",
    "locations:view",
    "report:view",
    "report:export",
    "user:view",
  ],

  DEPUTY_DIRECTOR: [
    "inventory:view",
    "locations:view",
    "report:view",
    "report:export",
    "user:view",
  ],

  WAREHOUSE_MANAGER: [
    "inventory:view",
    "inventory:manage",
    "inventory:in",
    "inventory:out",
    "inventory:transfer",
    "inventory:approve",
    "locations:view",
    "locations:manage",
    "report:view",
    "report:export",
    "user:view",
  ],

  WAREHOUSE_STAFF: [
    "inventory:view",
    "locations:view",
  ],

  CHIEF_ACCOUNTANT: [
    "inventory:view",
    "locations:view",
    "report:view",
    "report:export",
    "user:view",
  ],

  DEPUTY_ACCOUNTANT: [
    "inventory:view",
    "locations:view",
    "report:view",
    "report:export",
  ],

  ACCOUNTANT: [
    "inventory:view",
    "locations:view",
    "report:view",
  ],
};

export function hasPermission(session: any, key: string): boolean {
  if (!session) return false;
  if (session.role === "ADMIN") return true;
  
  const staticPerms = ROLE_PERMISSIONS[session.role as string] || [];
  if (staticPerms.includes("*") || staticPerms.includes(key)) return true;

  if (session.permissions && session.permissions.includes(key)) return true;

  return false;
}
