"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/admin/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs text-[#94A3B8] hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md transition flex-shrink-0"
      title="Sign out"
    >
      Logout
    </button>
  );
}
