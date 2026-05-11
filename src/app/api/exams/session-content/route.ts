import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram";
import { AuthRepository } from "@/features/auth/repository";
import { ExamContentRepository } from "@/features/exam/repository";

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

    const authRepository = new AuthRepository();
    const session = await authRepository.getCandidateSessionByTelegramUserId(
      verified.user.id,
    );

    if (!session) {
      return NextResponse.json({
        ok: true,
        examSets: [],
      });
    }

    const repository = new ExamContentRepository();
    const examSets = await repository.getPublishedExamsForCandidate(session);

    return NextResponse.json({
      ok: true,
      examSets,
    });
  } catch (error) {
    console.error("Exam session-content error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "exam_load_failed",
      },
      { status: 500 },
    );
  }
}
