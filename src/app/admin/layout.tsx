import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import "@/styles/admin.css";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Questions", href: "/admin/questions", icon: "📝" },
  { label: "Question Banks", href: "/admin/question-banks", icon: "📚" },
  { label: "Exam Sets", href: "/admin/exam-sets", icon: "📋" },
  { label: "Departments", href: "/admin/departments", icon: "🏛️" },
  { label: "Topics", href: "/admin/topics", icon: "🏷️" },
  { label: "Candidates", href: "/admin/candidates", icon: "👤" },
  { label: "Settings", href: "/admin/settings", icon: "⚙️" },
];

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

        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1A202C] transition [&.active]:bg-[#003580]/5 [&.active]:text-[#003580] [&.active]:font-semibold"
            >
              <span className="text-base w-5 text-center flex-shrink-0">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

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
