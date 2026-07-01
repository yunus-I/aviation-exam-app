import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/supabase/api-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { QUESTION_IMAGES_BUCKET } from "@/lib/supabase/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    },
  );

  const { data: images } = await supabase
    .from("question_media")
    .select("*")
    .eq("question_id", id)
    .order("sort_order");

  const adminClient = getSupabaseAdminClient();
  const items = (images ?? []).map((img) => {
    const { data } = adminClient.storage
      .from(QUESTION_IMAGES_BUCKET)
      .getPublicUrl(img.storage_path);
    return { ...img, public_url: data.publicUrl };
  });

  return NextResponse.json({ ok: true, images: items });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");

  if (!mediaId) {
    return NextResponse.json({ error: "mediaId query param required" }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    },
  );

  const { data: media } = await supabase
    .from("question_media")
    .select("storage_path")
    .eq("id", mediaId)
    .eq("question_id", id)
    .maybeSingle();

  if (!media) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const adminClient = getSupabaseAdminClient();
  await adminClient.storage.from(QUESTION_IMAGES_BUCKET).remove([media.storage_path]);

  await supabase.from("question_media").delete().eq("id", mediaId);

  return NextResponse.json({ ok: true });
}
