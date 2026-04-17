"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/actions/users/updateProfile";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface UserProfile {
  username: string;
  role: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
}

export function ProfileClient({ initialData }: { initialData: UserProfile }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fullName = (form.elements.namedItem("fullName") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
    const department = (form.elements.namedItem("department") as HTMLInputElement).value;

    startTransition(async () => {
      const res = await updateProfile({ fullName, email, phone, department });
      if (res.success) {
        toast.success(t("common.saved") || "Profile updated successfully!");
      } else {
        toast.error("Failed to update profile", { description: res.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full pt-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{t("profile.title") || "User Profile"}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("profile.subtitle") || "Manage your personal settings."}</p>
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-gray-100 dark:border-slate-800">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("profile.usernameLocked") || "Username (Locked)"}</label>
               <input 
                 type="text" 
                 value={initialData.username}
                 disabled
                 className="w-full bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm cursor-not-allowed"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("profile.roleLocked") || "Role (Locked)"}</label>
               <input 
                 type="text" 
                 value={initialData.role}
                 disabled
                 className="w-full bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm cursor-not-allowed"
               />
             </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("profile.fullName") || "Full Name"}</label>
               <input 
                 name="fullName"
                 defaultValue={initialData.fullName || ""}
                 disabled={isPending}
                 placeholder={t("profile.fullNamePlaceholder") || "Your full name"}
                 className="w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("profile.email") || "Email"}</label>
               <input 
                 name="email"
                 type="email"
                 defaultValue={initialData.email || ""}
                 disabled={isPending}
                 placeholder={t("profile.emailPlaceholder") || "your@email.com"}
                 className="w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("profile.phone") || "Phone"}</label>
               <input 
                 name="phone"
                 defaultValue={initialData.phone || ""}
                 disabled={isPending}
                 placeholder={t("profile.phonePlaceholder") || "Phone number"}
                 className="w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("profile.department") || "Department"}</label>
               <input 
                 name="department"
                 defaultValue={initialData.department || ""}
                 disabled={isPending}
                 placeholder={t("profile.departmentPlaceholder") || "e.g. Warehouse A"}
                 className="w-full bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
               />
             </div>
          </div>
          
          <div className="pt-4 flex justify-end">
             <button 
               type="submit"
               disabled={isPending}
               className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
             >
               {isPending ? t("common.saving") || "Saving..." : t("common.save") || "Save Changes"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
