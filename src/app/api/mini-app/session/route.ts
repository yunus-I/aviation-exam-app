import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram";
import { AuthRepository } from "@/features/auth/repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { initDataRaw?: string };
    const initDataRaw = body.initDataRaw?.trim();

    if (!initDataRaw) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_init_data",
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

    const repository = new AuthRepository();
    const session = await repository.getCandidateSessionByTelegramUserId(
      verified.user.id,
    );

    return NextResponse.json({
      ok: true,
      telegramUser: verified.user,
      session,
    });
  } catch (error) {
    console.error("Mini App session error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "session_failed",
      },
      { status: 500 },
    );
  }
}
