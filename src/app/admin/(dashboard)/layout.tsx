import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { SidebarDeptNav } from "@/components/admin/sidebar-dept-nav";
import "@/styles/admin.css";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex">
      <aside className="w-60 bg-white border-r border-[#E4E8F0] flex-shrink-0 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[#E4E8F0] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#003580] flex items-center justify-center text-white text-xs font-black">
            EA
          </div>
          <span className="text-sm font-bold text-[#003580]">Admin Panel</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1A202C] transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Dashboard
          </Link>
          <div className="text-[10px] font-semibold tracking-wider uppercase text-[#94A3B8] px-3.5 pt-4 pb-1.5">
            Departments
          </div>
          <SidebarDeptNav />
        </div>

        <div className="p-3 border-t border-[#E4E8F0]">
          <div className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-[#64748B]">
            <div className="w-7 h-7 rounded-full bg-[#003580] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#1A202C] truncate">
                {user.email}
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-6 lg:p-8">{children}</main>
    </div>
  );
}
