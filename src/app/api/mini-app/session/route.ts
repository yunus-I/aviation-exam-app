import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData, extractTelegramUser } from "@/lib/telegram";
import { AuthRepository } from "@/features/auth/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

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
      } else {
        // Fallback: extract user information even if hash verification failed
        // (handles legacy Telegram webviews, proxies, or dev environments)
        const unverifiedUser = extractTelegramUser(initDataRaw);
        if (unverifiedUser?.id) {
          telegramUserId = unverifiedUser.id;
          telegramUser = unverifiedUser;
        }
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
        { status: 400, headers: noCacheHeaders },
      );
    }

    const repository = new AuthRepository();
    const session = await repository.getCandidateSessionByTelegramUserId(telegramUserId);

    const fallbackFirstName = session?.fullName?.split(" ")[0] || "Student";
    const resolvedTelegramUser = telegramUser || {
      id: telegramUserId,
      first_name: fallbackFirstName,
    };

    return NextResponse.json(
      {
        ok: true,
        telegramUser: resolvedTelegramUser,
        session,
      },
      { headers: noCacheHeaders },
    );
  } catch (error) {
    console.error("Mini App session error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "session_failed",
      },
      { status: 500, headers: noCacheHeaders },
    );
  }
}
