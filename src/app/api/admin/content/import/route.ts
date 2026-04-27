import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram";
import { ExamContentRepository } from "@/features/exam/repository";
import type { ContentImportPayload } from "@/features/exam/content-types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      initDataRaw?: string;
      payload?: ContentImportPayload;
    };

    const initDataRaw = body.initDataRaw?.trim();
    const payload = body.payload;

    if (!initDataRaw || !payload) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_payload",
        },
        { status: 400 },
      );
    }

    const verified = verifyTelegramInitData(initDataRaw);

    if (!verified?.user?.id) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_init_data",
        },
        { status: 401 },
      );
    }

    const repository = new ExamContentRepository();
    const result = await repository.importContentPackage(
      payload,
      verified.user.id,
    );

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("Content import error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "content_import_failed",
      },
      { status: 500 },
    );
  }
}
