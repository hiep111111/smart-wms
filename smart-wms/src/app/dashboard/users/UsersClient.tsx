"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { UserRow } from "@/actions/users/getUsers";

export function UsersClient({ initialData }: { initialData: UserRow[] }) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t("users.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("users.subtitle")}</p>
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
                initialData.map((user) => (
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
                      <Link
                        href={`/dashboard/users/${user.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                      >
                        {t("users.editPermissions")}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
