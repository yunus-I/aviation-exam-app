"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Button                                                            */
/* ------------------------------------------------------------------ */
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}
export function Button({ variant = "primary", size = "md", loading, children, className = "", disabled, ...props }: BtnProps) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";
  const variants: Record<string, string> = {
    primary: "bg-[#003580] text-white hover:bg-[#00276B] focus:ring-[#003580]/30 shadow-sm hover:shadow-md active:scale-[0.98]",
    secondary: "bg-white text-[#1A202C] border border-[#E4E8F0] hover:bg-[#F7F8FC] hover:border-[#CBD5E1] focus:ring-[#E4E8F0] active:scale-[0.98]",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 focus:ring-red-200 active:scale-[0.98]",
    ghost: "bg-transparent text-[#64748B] hover:bg-[#F7F8FC] hover:text-[#1A202C] focus:ring-[#E4E8F0]",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-sm",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      )}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Badge                                                             */
/* ------------------------------------------------------------------ */
interface BadgeProps { children: ReactNode; variant?: "default" | "success" | "warning" | "danger" | "neutral"; className?: string; }
export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const map: Record<string, string> = {
    default: "bg-blue-50 text-blue-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    neutral: "bg-gray-50 text-gray-600",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${map[variant]} ${className}`}>{children}</span>;
}

/* ------------------------------------------------------------------ */
/*  Card                                                              */
/* ------------------------------------------------------------------ */
interface CardProps { children: ReactNode; className?: string; hover?: boolean; }
export function Card({ children, className = "", hover }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-[#E4E8F0] shadow-sm ${hover ? "hover:shadow-md hover:border-[#CBD5E1] transition-all duration-200" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StatCard                                                          */
/* ------------------------------------------------------------------ */
interface StatCardProps { label: string; value: string | number; icon: ReactNode; trend?: string; trendUp?: boolean; }
export function StatCard({ label, value, icon, trend, trendUp }: StatCardProps) {
  return (
    <Card hover className="p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#003580]/5 flex items-center justify-center text-[#003580] flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-[#1A202C] tracking-tight">{value}</p>
        <p className="text-xs text-[#64748B] mt-0.5">{label}</p>
        {trend && (
          <p className={`text-xs mt-1.5 font-medium ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </p>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Input                                                             */
/* ------------------------------------------------------------------ */
interface InputProps { label?: string; error?: string; icon?: ReactNode; className?: string; placeholder?: string; value?: string | number; defaultValue?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; name?: string; type?: string; required?: boolean; min?: number; max?: number; rows?: number; }
export function Input({ label, error, icon, className = "", ...props }: InputProps) {
  const base = "w-full px-3.5 py-2.5 bg-white border border-[#E4E8F0] rounded-xl text-sm text-[#1A202C] placeholder:text-[#94A3B8] focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/10 outline-none transition";
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-[#1A202C]">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">{icon}</div>}
        {props.rows ? (
          <textarea className={`${base} resize-y ${icon ? "pl-9" : ""} ${className}`} {...(props as any)} />
        ) : (
          <input className={`${base} ${icon ? "pl-9" : ""} ${className}`} {...(props as any)} />
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Select                                                            */
/* ------------------------------------------------------------------ */
interface SelectProps { label?: string; value?: string; defaultValue?: string; onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void; className?: string; children: ReactNode; required?: boolean; name?: string; }
export function Select({ label, className = "", children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-[#1A202C]">{label}</label>}
      <select className={`w-full px-3.5 py-2.5 bg-white border border-[#E4E8F0] rounded-xl text-sm text-[#1A202C] focus:border-[#003580] focus:ring-2 focus:ring-[#003580]/10 outline-none transition ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SectionHeader                                                     */
/* ------------------------------------------------------------------ */
interface SectionHeaderProps { title: string; description?: string; icon?: ReactNode; action?: ReactNode; }
export function SectionHeader({ title, description, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {icon && <div className="w-8 h-8 rounded-lg bg-[#003580]/5 flex items-center justify-center text-[#003580] flex-shrink-0">{icon}</div>}
        <div>
          <h2 className="text-lg font-bold text-[#1A202C]">{title}</h2>
          {description && <p className="text-sm text-[#64748B] mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  EmptyState                                                        */
/* ------------------------------------------------------------------ */
interface EmptyStateProps { icon: ReactNode; title: string; description: string; action?: ReactNode; }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-[#F7F8FC] border border-[#E4E8F0] flex items-center justify-center text-[#94A3B8] mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#1A202C]">{title}</h3>
      <p className="text-sm text-[#64748B] mt-1 mb-5 text-center max-w-xs">{description}</p>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton                                                          */
/* ------------------------------------------------------------------ */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-[#E4E8F0] rounded-xl animate-pulse ${className}`} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="w-8 h-4" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-20 h-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PageHeader                                                        */
/* ------------------------------------------------------------------ */
interface PageHeaderProps { title: string; description?: string; action?: ReactNode; }
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A202C] tracking-tight">{title}</h1>
        {description && <p className="text-sm text-[#64748B] mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0 flex items-center gap-3">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ConfirmDialog                                                     */
/* ------------------------------------------------------------------ */
interface ConfirmDialogProps { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel?: string; confirmVariant?: "primary" | "danger"; loading?: boolean; children?: ReactNode; }
export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", confirmVariant = "danger", loading, children }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-xl border border-[#E4E8F0] p-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-150" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-[#1A202C]">{title}</h3>
        <p className="text-sm text-[#64748B] mt-2">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant={confirmVariant} size="md" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
