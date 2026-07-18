"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
 const router = useRouter();
 const supabase = createClient();
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);

 async function handleLogin(e: React.FormEvent) {
 e.preventDefault();
 setError("");
 setLoading(true);

 const { error: signInError } = await supabase.auth.signInWithPassword({
 email,
 password,
 });

 if (signInError) {
 setError(signInError.message);
 setLoading(false);
 return;
 }

 router.refresh();
 router.push("/admin");
 }

 return (
 <div className="min-h-screen flex items-center justify-center bg-[#F7F8FC] p-6">
 <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-10 border border-[#E4E8F0]">
 <div className="flex flex-col items-center gap-3 mb-8">
 <div className="w-16 h-16 rounded-xl admin-logo-sq flex items-center justify-center text-white text-2xl font-black shadow-lg ">
 EA
 </div>
 <h1 className="text-lg font-bold text-[#003580]">Admin Panel</h1>
 <p className="text-sm text-[#64748B] text-center">
 Sign in to manage exam questions
 </p>
 </div>

 <form onSubmit={handleLogin} className="flex flex-col gap-4">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-semibold text-[#1A202C]">
 Email
 </label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 placeholder="admin@example.com"
 required
 className="w-full px-3.5 py-2.5 border border-[#E4E8F0] rounded-lg text-sm focus:border-brand focus:ring-3 /10 outline-none transition"
 />
 </div>

 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-semibold text-[#1A202C]">
 Password
 </label>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 required
 className="w-full px-3.5 py-2.5 border border-[#E4E8F0] rounded-lg text-sm focus:border-brand focus:ring-3 /10 outline-none transition"
 />
 </div>

 {error && (
 <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-xs text-red-700">
 <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
 {error}
 </div>
 )}

 <button
 type="submit"
 disabled={loading}
 className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white admin-logo-sq hover:admin-logo-sq-strong active:bg-[#001F52] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm hover:shadow-md"
 >
 {loading ? (
 <>
 <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
 Signing in...
 </>
 ) : "Sign in"}
 </button>
 </form>
 </div>
 </div>
 );
}
