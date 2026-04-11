export type Role =
  | "ADMIN"
  | "DIRECTOR"
  | "WAREHOUSE_MANAGER"
  | "WAREHOUSE_STAFF"
  | "OFFICE_STAFF"
  | "CHIEF_ACCOUNTANT"
  | "DEPUTY_ACCOUNTANT"
  | "ACCOUNTING_STAFF"
  | "SALES_STAFF";

export type SessionPayload = {
  userId: string;
  username: string;
  role: Role;
  permissions: string[];
  isActive: boolean;
};
