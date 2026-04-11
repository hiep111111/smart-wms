import { getUsers } from "@/actions/users/getUsers";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const result = await getUsers();

  return (
    <div className="flex flex-col gap-6">
      {!result.success && (
        <div className="flex items-center justify-center p-8">
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
            Failed to load users: {result.error}
          </div>
        </div>
      )}

      {result.success && <UsersClient initialData={result.data || []} />}
    </div>
  );
}
