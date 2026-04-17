import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/prisma/db";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      username: true,
      role: true,
      fullName: true,
      email: true,
      phone: true,
      department: true,
    }
  });

  if (!user) redirect("/login");

  return <ProfileClient initialData={user} />;
}
