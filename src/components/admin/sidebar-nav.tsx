"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Questions", href: "/admin/questions", icon: "📝" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
              isActive
                ? "bg-[#003580]/5 text-[#003580] font-semibold"
                : "text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1A202C]"
            }`}
          >
            <span className="text-base w-5 text-center flex-shrink-0">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
