"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, PanelLeft } from "lucide-react";
import { DEPTS, type DeptSlug } from "@/lib/admin/constants";

export function TopNav({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();

  function getTitle(): string {
    if (pathname === "/admin") return "Dashboard";
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const slug = parts[1] as DeptSlug;
      const dept = DEPTS[slug];
      if (dept) {
        if (parts[2] === "new") return `New Question — ${dept.label}`;
        if (parts[2] === "edit" || parts[3] === "edit") return `Edit Question — ${dept.label}`;
        return `${dept.nameEn} Questions`;
      }
    }
    return "Admin";
  }

  return (
    <header className="sticky top-0 z-10 h-16 bg-white border-b border-[#E4E8F0] flex items-center gap-4 px-6 lg:px-8 flex-shrink-0">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden w-9 h-9 rounded-xl bg-[#F7F8FC] border border-[#E4E8F0] flex items-center justify-center text-[#64748B] hover:text-[#1A202C] hover:bg-[#F1F4F9] transition"
      >
        <PanelLeft className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-[#1A202C] truncate">{getTitle()}</h1>
      </div>

      <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-[#F7F8FC] border border-[#E4E8F0] rounded-xl text-sm text-[#94A3B8] min-w-[200px]">
        <Search className="w-4 h-4 flex-shrink-0" />
        <span>Search questions...</span>
      </div>

      <button className="relative w-9 h-9 rounded-xl bg-[#F7F8FC] border border-[#E4E8F0] flex items-center justify-center text-[#64748B] hover:text-[#1A202C] hover:bg-[#F1F4F9] transition">
        <Bell className="w-4 h-4" />
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#003580] text-white text-[8px] font-bold flex items-center justify-center">3</span>
      </button>

      <div className="w-9 h-9 rounded-xl bg-[#003580] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm shadow-[#003580]/20">
        A
      </div>
    </header>
  );
}
