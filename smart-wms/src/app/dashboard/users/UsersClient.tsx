"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { UserRow } from "@/actions/users/getUsers";
import { useState, useTransition } from "react";
import { CreateUserModal } from "./CreateUserModal";
import { toggleUserStatus } from "@/actions/users/toggleUserStatus";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function UsersClient({ initialData }: { initialData: UserRow[] }) {
  const { t } = useLanguage();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");

  const roles = Array.from(new Set(initialData.map(u => u.role))) as string[];

  const filteredUsers = initialData.filter(u => {
    let match = true;
    if (searchTerm && !u.username.toLowerCase().includes(searchTerm.toLowerCase())) match = false;
    if (filterRole !== "ALL" && u.role !== filterRole) match = false;
    return match;
  });

  function handleToggle(user: UserRow) {
    setConfirmUser(user);
  }

  function handleConfirmToggle() {
    if (!confirmUser) return;
    const user = confirmUser;
    setConfirmUser(null);
    const actionStr = user.isActive ? "deactivate" : "activate";
    
    startTransition(async () => {
      const res = await toggleUserStatus(user.id, !user.isActive);
      if (res.success) {
        toast.success(`User ${user.username} ${actionStr}d.`);
      } else {
        toast.error("Action failed", { description: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <CreateUserModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      
      <ConfirmModal 
        isOpen={!!confirmUser}
        title={confirmUser?.isActive ? "Deactivate User" : "Activate User"}
        message={`Are you sure you want to ${confirmUser?.isActive ? "deactivate" : "activate"} user ${confirmUser?.username}?`}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmUser(null)}
        confirmText={confirmUser?.isActive ? "Deactivate" : "Activate"}
        isDestructive={!!confirmUser?.isActive}
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("users.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("users.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {t("table.createOne") || "Add User"}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm username..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm w-full sm:w-64 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <select 
            value={filterRole} 
            onChange={e => setFilterRole(e.target.value)} 
            className="text-sm border border-gray-300 rounded p-2 focus:border-blue-500"
          >
            <option value="ALL">Tất cả chức vụ (Role)</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">{t("table.username")}</th>
                <th className="px-6 py-3">{t("table.role")}</th>
                <th className="px-6 py-3">{t("table.status")}</th>
                <th className="px-6 py-3">{t("table.permissions")}</th>
                <th className="px-6 py-3 text-right">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                    {t("table.noUsers")}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="whitespace-nowrap px-6 py-3 font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {user.role}
                    </td>
                    <td className="px-6 py-3">
                      {user.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 ring-1 ring-green-200 ring-inset">
                          {t("table.active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-red-200 ring-inset">
                          {t("table.inactive")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {user.permissions.length} granting(s)
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/dashboard/users/${user.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                        >
                          {t("users.editPermissions") || "Permissions"}
                        </Link>
                        <button
                          onClick={() => handleToggle(user)}
                          disabled={isPending}
                          className={`text-sm font-medium transition-colors ${
                            user.isActive ? "text-amber-600 hover:text-amber-500" : "text-green-600 hover:text-green-500"
                          } disabled:opacity-50`}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400 bg-gray-50">
          Hiển thị {filteredUsers.length} / {initialData.length} người dùng
        </div>
      </div>
    </div>
  );
}
