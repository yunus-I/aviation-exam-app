import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";

export async function getAdminUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: admin } = await supabase
    .from("admin_accounts")
    .select("id, is_super_admin")
    .eq("email", user.email)
    .maybeSingle();

  return admin;
}
