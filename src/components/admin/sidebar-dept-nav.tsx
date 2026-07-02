"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEPTS, DEPT_SLUGS } from "@/lib/admin/constants";

const icons: Record<string, string> = {
  amt: "⚙️",
  pilot: "✈️",
  cabin: "👋",
  mkt: "📈",
};

export function SidebarDeptNav() {
  const pathname = usePathname();

  return (
    <>
      {DEPT_SLUGS.map((slug) => {
        const dept = DEPTS[slug];
        const href = `/admin/${slug}`;
        const isActive = pathname === href || pathname.startsWith(href + "/");

        return (
          <Link
            key={slug}
            href={href}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-medium transition ${
              isActive
                ? "bg-[#003580]/5 text-[#003580] font-semibold"
                : "text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1A202C]"
            }`}
          >
            <span className="text-base w-5 text-center flex-shrink-0">
              {icons[slug]}
            </span>
            <span className="font-semibold tracking-wide">{dept.label}</span>
          </Link>
        );
      })}
    </>
  );
}
