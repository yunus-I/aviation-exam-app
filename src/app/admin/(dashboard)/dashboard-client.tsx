"use client";

import Link from "next/link";
import { Wrench, Plane, Users, Megaphone, HelpCircle, Plus, ArrowRight, Clock, FileText, HardDrive } from "lucide-react";
import { Card, Badge } from "@/components/admin/admin-ui";

interface Props {
  total: number;
  counts: Record<string, number>;
  recentQuestions: Array<{ id: string; num: number | null; prompt: string; type: string; dept: string; createdAt: string }>;
}

const deptConfig = {
  amt: { label: "AMT Maintenance", icon: Wrench, color: "text-blue-600", bg: "bg-blue-50", href: "/admin/amt" },
  pilot: { label: "Pilot", icon: Plane, color: "text-cyan-600", bg: "bg-cyan-50", href: "/admin/pilot" },
  cabin: { label: "Cabin Crew", icon: Users, color: "text-violet-600", bg: "bg-violet-50", href: "/admin/cabin" },
  mkt: { label: "Marketing", icon: Megaphone, color: "text-amber-600", bg: "bg-amber-50", href: "/admin/mkt" },
};

const typeLabel: Record<string, string> = { single_choice: "SC", multiple_choice: "MC", true_false: "TF" };
const typeVariant: Record<string, "default" | "success" | "warning" | "danger" | "neutral"> = { single_choice: "default", multiple_choice: "warning", true_false: "neutral" };

export function DashboardClient({ total, counts, recentQuestions }: Props) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A202C] tracking-tight">Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-1">Overview of your question bank</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href="/admin/amt" className="group block">
          <Card hover className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#003580]/5 flex items-center justify-center text-[#003580] group-hover:scale-105 transition-transform duration-200">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#1A202C] tracking-tight">{total.toLocaleString()}</p>
                <p className="text-xs text-[#64748B] mt-0.5">Total Questions</p>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs font-medium text-[#003580] opacity-0 group-hover:opacity-100 transition-opacity">
              View all <ArrowRight className="w-3 h-3" />
            </div>
          </Card>
        </Link>

        {(Object.entries(deptConfig) as [string, typeof deptConfig.amt][]).map(([slug, cfg]) => {
          const Icon = cfg.icon;
          const count = counts[slug] ?? 0;
          return (
            <Link key={slug} href={cfg.href} className="group block">
              <Card hover className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${cfg.bg} flex items-center justify-center ${cfg.color} group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#1A202C] tracking-tight">{count.toLocaleString()}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{cfg.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs font-medium text-[#003580] opacity-0 group-hover:opacity-100 transition-opacity">
                  Manage <ArrowRight className="w-3 h-3" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Questions */}
        <Card>
          <div className="p-5 border-b border-[#E4E8F0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F7F8FC] flex items-center justify-center text-[#64748B]">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-[#1A202C]">Recent Questions</h2>
            </div>
            <Link href="/admin/amt" className="text-xs font-semibold text-[#003580] hover:text-[#00276B] transition">View all</Link>
          </div>
          <div className="divide-y divide-[#E4E8F0]">
            {recentQuestions.length === 0 && (
              <div className="p-8 text-center text-sm text-[#64748B]">
                <FileText className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
                No questions yet
              </div>
            )}
            {recentQuestions.slice(0, 6).map((q) => (
              <Link key={q.id} href={`/admin/${q.dept.toLowerCase()}/${q.id}/edit`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F7F8FC] transition group">
                <Badge variant={typeVariant[q.type] || "default"}>{typeLabel[q.type] || q.type}</Badge>
                <span className="flex-1 min-w-0 text-sm text-[#1A202C] truncate group-hover:text-[#003580] transition-colors">
                  {q.prompt || "Untitled"}
                </span>
                <span className="text-[10px] font-semibold text-[#94A3B8] uppercase">{q.dept}</span>
              </Link>
            ))}
          </div>
        </Card>

        {/* Quick Actions & Storage */}
        <div className="space-y-6">
          <Card>
            <div className="p-5 border-b border-[#E4E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F8FC] flex items-center justify-center text-[#64748B]">
                  <Plus className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#1A202C]">Quick Actions</h2>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {(Object.entries(deptConfig) as [string, typeof deptConfig.amt][]).map(([slug, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <Link key={slug} href={`/admin/${slug}/new`} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#E4E8F0] hover:border-[#003580] hover:bg-[#003580]/5 transition-all duration-150 group">
                    <Icon className="w-5 h-5 text-[#94A3B8] group-hover:text-[#003580]" />
                    <span className="text-xs font-semibold text-[#64748B] group-hover:text-[#003580]">New {cfg.label.split(" ")[0]}</span>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F7F8FC] flex items-center justify-center text-[#64748B]">
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-[#1A202C]">Storage</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Question images & media</p>
              </div>
              <div className="text-xs text-[#94A3B8]">—</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
