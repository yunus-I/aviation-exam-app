import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram";
import { AuthRepository } from "@/features/auth/repository";
import { ExamContentRepository } from "@/features/exam/repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      initDataRaw?: string;
      examSet?: any;
      session?: any;
    };
    const { initDataRaw, examSet, session } = body;

    if (!initDataRaw?.trim() || !examSet || !session) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_payload",
        },
        { status: 400 },
      );
    }

    const verified = verifyTelegramInitData(initDataRaw.trim());

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
    const candidateSession = await authRepository.getCandidateSessionByTelegramUserId(
      verified.user.id,
    );

    if (!candidateSession || !candidateSession.departmentId || candidateSession.registrationStatus !== "approved") {
      return NextResponse.json(
        {
          ok: false,
          error: "not_approved",
        },
        { status: 403 },
      );
    }

    const repository = new ExamContentRepository();
    const attemptId = await repository.saveExamAttempt({
      candidateId: candidateSession.candidateId,
      departmentId: candidateSession.departmentId,
      examSet,
      session,
    });

    return NextResponse.json({
      ok: true,
      attemptId,
    });
  } catch (error) {
    console.error("Exam submit error", error);
    return NextResponse.json(
      {
        ok: false,
        error: "exam_submit_failed",
      },
      { status: 500 },
    );
  }
}
