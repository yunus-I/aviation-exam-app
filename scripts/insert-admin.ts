// @ts-nocheck
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { getSupabaseAdminClient } = await import("../src/lib/supabase/admin");
  const supabase = getSupabaseAdminClient();

  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const { data, error } = await supabase
    .from("admin_accounts")
    .upsert(
      {
        telegram_user_id: 5827966050,
        display_name: "Yunus",
        is_super_admin: true,
        is_active: true
      },
      { onConflict: "telegram_user_id" }
    )
    .select("id")
    .single();

  console.log("Admin UPSERT result:", data, error);
  if (error?.code === "PGRST205") {
    console.error("Supabase table admin_accounts is not available in the connected project. Ensure migrations were applied to the correct Supabase database.");
  }
}

main().catch((error) => {
  console.error("Admin seed failed:", error);
  console.error("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  process.exitCode = 1;
});
