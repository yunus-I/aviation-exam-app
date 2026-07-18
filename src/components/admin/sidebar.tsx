"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wrench, Plane, Users, Megaphone, Image, Settings, LogOut, ChevronLeft, PanelLeftClose, PanelLeft, BookOpen } from "lucide-react";
import { useState } from "react";
import { DEPTS, DEPT_SLUGS, type DeptSlug } from "@/lib/admin/constants";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
 { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
];

const deptIconMap: Record<DeptSlug, typeof Wrench> = {
 amt: Wrench,
 pilot: Plane,
 cabin: Users,
 mkt: Megaphone,
};

export function Sidebar() {
 const pathname = usePathname();
 const router = useRouter();
 const [collapsed, setCollapsed] = useState(false);
 const supabase = createClient();

 async function handleLogout() {
 await supabase.auth.signOut();
 router.refresh();
 router.push("/admin/login");
 }

 function isActive(href: string) {
 if (href === "/admin") return pathname === "/admin";
 return pathname.startsWith(href);
 }

 return (
 <>
 {/* Mobile overlay */}
 {!collapsed && (
 <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setCollapsed(true)} />
 )}

 <aside className={`fixed lg:sticky top-0 left-0 z-30 h-screen bg-white border-r border-[#E4E8F0] flex flex-col transition-all duration-200 ${collapsed ? "-translate-x-full lg:translate-x-0 lg:w-[72px]" : "translate-x-0 w-[260px]"}`}>
 {/* Logo */}
 <div className={`flex items-center h-16 px-5 border-b border-[#E4E8F0] flex-shrink-0 ${collapsed ? "justify-center px-0" : ""}`}>
 <div className="w-9 h-9 rounded-xl admin-logo-sq flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-sm ">
 EA
 </div>
 {!collapsed && <span className="ml-3 text-sm font-bold text-[#003580]">Admin Panel</span>}
 </div>

 {/* Navigation */}
 <nav className="flex-1 overflow-y-auto p-3 space-y-1">
 {/* Main */}
 {navItems.map((item) => {
 const Icon = item.icon;
 const active = isActive(item.href);
 return (
 <Link
 key={item.href}
 href={item.href}
 title={collapsed ? item.label : undefined}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
 active
 ? "admin-icon-wrap text-[#003580] font-semibold shadow-sm"
 : "text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1A202C]"
 } ${collapsed ? "justify-center px-0" : ""}`}
 >
 <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-[#003580]" : ""}`} />
 {!collapsed && <span>{item.label}</span>}
 </Link>
 );
 })}

 {/* Divider */}
 {!collapsed && <div className="h-px bg-[#E4E8F0] my-3" />}

 {/* Department label */}
 {!collapsed && (
 <div className="text-[10px] font-semibold tracking-wider uppercase text-[#94A3B8] px-3 pt-1 pb-1.5">
 Departments
 </div>
 )}

 {DEPT_SLUGS.map((slug) => {
 const dept = DEPTS[slug];
 const Icon = deptIconMap[slug];
 const href = `/admin/${slug}`;
 const active = isActive(href);
 return (
 <Link
 key={slug}
 href={href}
 title={collapsed ? dept.label : undefined}
 className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
 active
 ? "admin-icon-wrap text-[#003580] font-semibold shadow-sm"
 : "text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1A202C]"
 } ${collapsed ? "justify-center px-0" : ""}`}
 >
 {active && (
 <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full admin-logo-sq" />
 )}
 <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-[#003580]" : ""}`} />
 {!collapsed && (
 <>
 <span>{dept.label}</span>
 <span className="ml-auto text-[10px] font-semibold text-[#94A3B8] uppercase">{dept.label}</span>
 </>
 )}
 </Link>
 );
 })}

 {/* Divider */}
 {!collapsed && <div className="h-px bg-[#E4E8F0] my-3" />}

 {/* Notes link */}
 {(() => {
 const href = "/admin/notes";
 const active = isActive(href);
 return (
 <Link
 href={href}
 title={collapsed ? "Notes" : undefined}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
 active
 ? "admin-icon-wrap text-[#003580] font-semibold shadow-sm"
 : "text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1A202C]"
 } ${collapsed ? "justify-center px-0" : ""}`}
 >
 <BookOpen className={`w-5 h-5 flex-shrink-0 ${active ? "text-[#003580]" : ""}`} />
 {!collapsed && <span>Notes</span>}
 </Link>
 );
 })()}

 {/* Divider */}
 {!collapsed && (
 <div className="text-[10px] font-semibold tracking-wider uppercase text-[#94A3B8] px-3 pt-1 pb-1.5">
 System
 </div>
 )}

 {[
 { label: "Images", icon: Image, href: "#" },
 { label: "Settings", icon: Settings, href: "#" },
 ].map((item) => {
 const Icon = item.icon;
 return (
 <Link
 key={item.label}
 href={item.href}
 title={collapsed ? item.label : undefined}
 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#94A3B8] cursor-not-allowed ${collapsed ? "justify-center px-0" : ""}`}
 onClick={(e) => e.preventDefault()}
 >
 <Icon className="w-5 h-5 flex-shrink-0" />
 {!collapsed && <span>{item.label}</span>}
 {!collapsed && <span className="ml-auto text-[9px] font-semibold text-[#CBD5E1] uppercase tracking-wider">Soon</span>}
 </Link>
 );
 })}
 </nav>

 {/* Bottom - Logout */}
 <div className={`p-3 border-t border-[#E4E8F0] ${collapsed ? "flex justify-center" : ""}`}>
 <button
 onClick={handleLogout}
 title="Logout"
 className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-all duration-150 ${collapsed ? "justify-center px-0" : ""}`}
 >
 <LogOut className="w-5 h-5 flex-shrink-0" />
 {!collapsed && <span>Logout</span>}
 </button>
 </div>

 {/* Collapse toggle (desktop) */}
 <button
 onClick={() => setCollapsed(!collapsed)}
 className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-[#E4E8F0] items-center justify-center text-[#94A3B8] hover:text-[#1A202C] hover:border-[#CBD5E1] shadow-sm transition z-10"
 >
 {collapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
 </button>

 {/* Mobile close */}
 <button
 onClick={() => setCollapsed(true)}
 className="lg:hidden absolute top-3 right-3 w-7 h-7 rounded-lg bg-[#F7F8FC] flex items-center justify-center text-[#64748B]"
 >
 <PanelLeftClose className="w-4 h-4" />
 </button>
 </aside>
 </>
 );
}
