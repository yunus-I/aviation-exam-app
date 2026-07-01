import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/api-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { QUESTION_IMAGES_BUCKET } from "@/lib/supabase/storage";

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const questionId = formData.get("question_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!questionId) {
      return NextResponse.json({ error: "question_id is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "png";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseAdminClient();
    const { error: uploadError } = await supabase.storage
      .from(QUESTION_IMAGES_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "31536000",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from(QUESTION_IMAGES_BUCKET)
      .getPublicUrl(fileName);

    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        },
      },
    );

    const { data: maxSort } = await client
      .from("question_media")
      .select("sort_order")
      .eq("question_id", questionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSort = (maxSort?.sort_order ?? 0) + 1;

    const { error: mediaError } = await client
      .from("question_media")
      .insert({
        question_id: questionId,
        media_kind: "image",
        storage_path: fileName,
        sort_order: nextSort,
      });

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      path: fileName,
      url: urlData.publicUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
