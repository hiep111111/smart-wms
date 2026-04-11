"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePermissions } from "@/actions/users/updatePermissions";

const AVAILABLE_PERMISSIONS = [
  { key: "inventory:in", label: "Inventory In" },
  { key: "inventory:out", label: "Inventory Out" },
  { key: "inventory:transfer", label: "Inventory Transfer" },
  { key: "reports:view", label: "View Reports" },
  { key: "users:manage", label: "Manage Users" }
];

export default function PermissionsClient({
  userId,
  username,
  role,
  initialPermissions,
}: {
  userId: string;
  username: string;
  role: string;
  initialPermissions: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(initialPermissions);
  const [error, setError] = useState<string | null>(null);

  const togglePermission = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updatePermissions({ userId, permissions: selected });
      if (res.success) {
        router.refresh();
        router.push("/dashboard/users");
      } else {
        setError(res.error || "Failed to update permissions");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Edit Permissions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage access rights for <span className="font-semibold text-gray-900">{username}</span> (Role: {role})
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">Available Permissions</h2>
          <div className="space-y-3">
            {AVAILABLE_PERMISSIONS.map((perm) => {
              const isChecked = selected.includes(perm.key);
              return (
                <label key={perm.key} className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex h-5 items-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(perm.key)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 focus:ring-offset-2 transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isChecked ? 'text-gray-900' : 'text-gray-700'} group-hover:text-blue-600 transition-colors`}>{perm.label}</span>
                    <span className="text-xs text-gray-500 font-mono">{perm.key}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={() => router.push("/dashboard/users")}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
