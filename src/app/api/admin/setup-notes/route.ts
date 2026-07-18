import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/api-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/setup-notes
 * Creates the `notes` table if it does not already exist.
 * Only callable by authenticated admin users.
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient() as any;

    // Try to query the table first — if it works, nothing to do
    const { error: checkError } = await supabase
      .from("notes")
      .select("id")
      .limit(1);

    if (!checkError) {
      return NextResponse.json({ ok: true, message: "Notes table already exists." });
    }

    // Table doesn't exist — create it via rpc exec_sql (Supabase built-in)
    const createSQL = `
      CREATE TABLE IF NOT EXISTS public.notes (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        dept text NOT NULL,
        title text NOT NULL,
        content text NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;

    const { error: rpcError } = await supabase.rpc("exec_sql", { sql: createSQL });

    if (rpcError) {
      // exec_sql RPC may not exist — return a helpful message with the SQL
      return NextResponse.json(
        {
          ok: false,
          error: "Could not auto-create the table. Please run the SQL manually in your Supabase SQL Editor.",
          sql: createSQL.trim(),
          rpcError: rpcError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: "Notes table created successfully." });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}
