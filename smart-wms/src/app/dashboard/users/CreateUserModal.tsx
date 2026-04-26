"use client";

import { useState, useTransition } from "react";
import { createUser } from "@/actions/users/createUser";
import { toast } from "sonner";
import type { Role } from "@/lib/auth/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES: Role[] = [
  "ADMIN", "DIRECTOR", "DEPUTY_DIRECTOR", "WAREHOUSE_MANAGER", 
  "WAREHOUSE_STAFF", "OFFICE_STAFF", "CHIEF_ACCOUNTANT", 
  "DEPUTY_ACCOUNTANT", "ACCOUNTING_STAFF", "SALES_STAFF"
];

export function CreateUserModal({ isOpen, onClose }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement).value;
    const passwordRaw = (form.elements.namedItem("passwordRaw") as HTMLInputElement).value;
    const role = (form.elements.namedItem("role") as HTMLSelectElement).value as Role;

    startTransition(async () => {
      const res = await createUser({ username, passwordRaw, role });
      if (res.success) {
        toast.success("User created successfully!");
        onClose();
      } else {
        toast.error("Failed to create user", { description: res.error });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Create New User</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input 
              name="username" 
              required 
              disabled={isPending}
              placeholder="e.g. jdoe"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input 
              name="passwordRaw" 
              type="password"
              minLength={6}
              required 
              disabled={isPending}
              placeholder="Min 6 characters"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select 
              name="role" 
              required 
              disabled={isPending}
              defaultValue="WAREHOUSE_STAFF"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              disabled={isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
