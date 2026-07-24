import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram";
import { AuthRepository } from "@/features/auth/repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { initDataRaw?: string; telegramUserId?: number | string };
    const initDataRaw = body.initDataRaw?.trim();

    let telegramUserId: number | null = null;
    let telegramUser: any = null;

    if (initDataRaw) {
      const verified = verifyTelegramInitData(initDataRaw);
      if (verified?.user?.id) {
        telegramUserId = verified.user.id;
        telegramUser = verified.user;
      }
    }

    if (!telegramUserId && body.telegramUserId) {
      const parsed = Number(body.telegramUserId);
      if (!isNaN(parsed) && parsed > 0) {
        telegramUserId = parsed;
      }
    }

    if (!telegramUserId) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_identifier",
        },
        { status: 400 },
      );
    }

    const repository = new AuthRepository();
    const session = await repository.getCandidateSessionByTelegramUserId(telegramUserId);

    return NextResponse.json({
      ok: true,
      telegramUser: telegramUser || (session ? { id: telegramUserId, first_name: session.fullName } : null),
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
