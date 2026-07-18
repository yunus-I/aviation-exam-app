"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { TopNav } from "@/components/admin/top-nav";
import { ToastProvider } from "@/components/admin/toat-provider";

export function AdminShell({ children }: { children: ReactNode }) {
 const [sidebarOpen, setSidebarOpen] = useState(false);

 return (
 <ToastProvider>
 <div className="min-h-screen bg-[#F7F8FC] flex">
 <Sidebar />
 <div className="flex-1 flex flex-col min-w-0">
 <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
 <main className="flex-1 overflow-y-auto p-6 lg:p-8 2xl:p-10">
 <div className="mx-auto max-w-7xl">{children}</div>
 </main>
 </div>
 </div>
 </ToastProvider>
 );
}
