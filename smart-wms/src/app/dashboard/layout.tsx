import { Sidebar } from "@/components/ui/Sidebar";

import { requireSession } from "@/lib/auth/checkPermission";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar session={session} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
