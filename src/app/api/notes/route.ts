import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get("dept")?.trim();

    if (!dept) {
      return NextResponse.json({ ok: false, error: "dept parameter is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient() as any;

    const { data, error } = await supabase
      .from("notes")
      .select("id, dept, title, content, created_at, set_name")
      .eq("dept", dept)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[notes GET]", error);
      // Detect table-missing error (Supabase returns code 42P01)
      const isTableMissing =
        error.code === "42P01" ||
        error.message?.toLowerCase().includes("does not exist") ||
        error.message?.toLowerCase().includes("relation");
      if (isTableMissing) {
        return NextResponse.json(
          { ok: false, error: "notes table does not exist", table_missing: true },
          { status: 503 }
        );
      }
      return NextResponse.json({ ok: false, error: "Failed to fetch notes." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, notes: data ?? [] });
  } catch (err) {
    console.error("[notes GET] unexpected error", err);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dept, title, content, set_name } = body as { dept?: string; title?: string; content?: string; set_name?: string };

    if (!dept || !title || !content) {
      return NextResponse.json({ ok: false, error: "dept, title and content are required." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient() as any;

    const { data, error } = await supabase
      .from("notes")
      .insert({ dept: dept.trim(), title: title.trim(), content: content.trim(), set_name: set_name?.trim() || "Note 1" })
      .select()
      .single();

    if (error) {
      console.error("[notes POST]", error);
      return NextResponse.json({ ok: false, error: "Failed to create note." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, note: data }, { status: 201 });
  } catch (err) {
    console.error("[notes POST] unexpected error", err);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, content, set_name } = body as { id?: string; title?: string; content?: string; set_name?: string };

    if (!id || !title || !content) {
      return NextResponse.json({ ok: false, error: "id, title and content are required." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient() as any;

    const { data, error } = await supabase
      .from("notes")
      .update({ title: title.trim(), content: content.trim(), set_name: set_name?.trim() || "Note 1" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[notes PUT]", error);
      return NextResponse.json({ ok: false, error: "Failed to update note." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, note: data });
  } catch (err) {
    console.error("[notes PUT] unexpected error", err);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json({ ok: false, error: "id parameter is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient() as any;

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[notes DELETE]", error);
      return NextResponse.json({ ok: false, error: "Failed to delete note." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notes DELETE] unexpected error", err);
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
