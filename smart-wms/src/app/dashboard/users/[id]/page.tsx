import { getUser } from "@/actions/users/getUser";
import PermissionsClient from "./PermissionsClient";
import { notFound } from "next/navigation";

export default async function UserPermissionsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const result = await getUser(params.id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
          Failed to load user: {result.error}
        </div>
      </div>
    );
  }

  const user = result.data;
  if (!user) {
    notFound();
  }

  return (
    <PermissionsClient
      userId={user.id}
      username={user.username}
      role={user.role}
      initialPermissions={user.permissions}
    />
  );
}
