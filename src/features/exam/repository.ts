// @ts-nocheck
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MiniAppCandidateSession } from "@/features/auth/repository";
import type { ContentImportPayload } from "@/features/exam/content-types";
import type { ExamQuestion, ExamSet } from "@/features/exam/types";

type AdminIdentity = {
  id: string;
  telegramUserId: number;
};

export class ExamContentRepository {
  private readonly supabase = getSupabaseAdminClient();

  async getAdminByTelegramUserId(telegramUserId: number) {
    const result = await this.supabase
      .from("admin_accounts")
      .select("id, telegram_user_id")
      .eq("telegram_user_id", telegramUserId)
      .eq("is_active", true)
      .single();

    if (result.error) {
      throw result.error;
    }

    return {
      id: result.data.id,
      telegramUserId: Number(result.data.telegram_user_id),
    } satisfies AdminIdentity;
  }

  private async getDepartmentByCode(code: string) {
    const result = await this.supabase
      .from("departments")
      .select("id, name_en")
      .eq("code", code)
      .single();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  private async getTopicBySlug(slug?: string) {
    if (!slug) {
      return null;
    }

    const result = await this.supabase
      .from("topics")
      .select("id, name_en")
      .eq("slug", slug)
      .single();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  async importContentPackage(
    payload: ContentImportPayload,
    adminTelegramUserId: number,
  ) {
    const admin = await this.getAdminByTelegramUserId(adminTelegramUserId);
    const department = await this.getDepartmentByCode(
      payload.examSet.departmentCode,
    );
    const bankDepartment = await this.getDepartmentByCode(
      payload.questionBank.departmentCode,
    );
    const examTopic = await this.getTopicBySlug(payload.examSet.topicSlug);
    const bankTopic = await this.getTopicBySlug(payload.questionBank.topicSlug);

    const bankUpsert = await this.supabase
      .from("question_banks")
      .upsert(
        {
          import_key: payload.questionBank.key,
          slug: payload.questionBank.slug,
          title_en: payload.questionBank.title,
          description_en: payload.questionBank.description ?? null,
          department_id: bankDepartment.id,
          topic_id: bankTopic?.id ?? null,
          is_active: true,
        },
        { onConflict: "import_key" },
      )
      .select("id")
      .single();

    if (bankUpsert.error) {
      throw bankUpsert.error;
    }

    const examSetUpsert = await this.supabase
      .from("exam_sets")
      .upsert(
        {
          import_key: payload.examSet.key,
          slug: payload.examSet.slug,
          title_en: payload.examSet.title,
          description_en: payload.examSet.description ?? null,
          department_id: department.id,
          topic_id: examTopic?.id ?? null,
          mode: payload.examSet.mode,
          duration_minutes: payload.examSet.durationMinutes,
          passing_score: payload.examSet.passingScore ?? null,
          is_published: payload.examSet.published ?? true,
          published_at: payload.examSet.published === false ? null : new Date().toISOString(),
          created_by_admin_id: admin.id,
        },
        { onConflict: "import_key" },
      )
      .select("id")
      .single();

    if (examSetUpsert.error) {
      throw examSetUpsert.error;
    }

    const examSetId = examSetUpsert.data.id;

    const deleteMappings = await this.supabase
      .from("exam_set_questions")
      .delete()
      .eq("exam_set_id", examSetId);

    if (deleteMappings.error) {
      throw deleteMappings.error;
    }

    let totalPoints = 0;

    for (let index = 0; index < payload.questions.length; index += 1) {
      const question = payload.questions[index];
      const questionTopic = await this.getTopicBySlug(question.topicSlug);
      const questionPoints = question.points ?? 1;
      totalPoints += questionPoints;

      const questionUpsert = await this.supabase
        .from("questions")
        .upsert(
          {
            import_key: question.key,
            question_bank_id: bankUpsert.data.id,
            department_id: department.id,
            topic_id: questionTopic?.id ?? examTopic?.id ?? null,
            source_label: question.sourceLabel ?? null,
            source_year: question.sourceYear ?? null,
            question_type: question.type,
            prompt_en: question.prompt,
            explanation_en: question.explanation ?? null,
            difficulty_level: question.difficultyLevel ?? 1,
            points: questionPoints,
            is_active: true,
            created_by_admin_id: admin.id,
          },
          { onConflict: "import_key" },
        )
        .select("id")
        .single();

      if (questionUpsert.error) {
        throw questionUpsert.error;
      }

      const questionId = questionUpsert.data.id;

      const deleteOptions = await this.supabase
        .from("question_options")
        .delete()
        .eq("question_id", questionId);

      if (deleteOptions.error) {
        throw deleteOptions.error;
      }

      const deleteMedia = await this.supabase
        .from("question_media")
        .delete()
        .eq("question_id", questionId);

      if (deleteMedia.error) {
        throw deleteMedia.error;
      }

      const optionInsert = await this.supabase.from("question_options").insert(
        question.options.map((option, optionIndex) => ({
          question_id: questionId,
          option_key: option.key,
          option_text_en: option.text,
          is_correct: option.isCorrect,
          sort_order: optionIndex + 1,
        })),
      );

      if (optionInsert.error) {
        throw optionInsert.error;
      }

      if (question.imageStoragePath) {
        const mediaInsert = await this.supabase.from("question_media").insert({
          question_id: questionId,
          storage_path: question.imageStoragePath,
          sort_order: 1,
        });

        if (mediaInsert.error) {
          throw mediaInsert.error;
        }
      }

      const examLinkInsert = await this.supabase.from("exam_set_questions").insert({
        exam_set_id: examSetId,
        question_id: questionId,
        sort_order: index + 1,
        points_override: questionPoints,
      });

      if (examLinkInsert.error) {
        throw examLinkInsert.error;
      }
    }

    const examUpdate = await this.supabase
      .from("exam_sets")
      .update({
        total_questions: payload.questions.length,
        total_points: totalPoints,
      })
      .eq("id", examSetId);

    if (examUpdate.error) {
      throw examUpdate.error;
    }

    return {
      examSetId,
      importedQuestionCount: payload.questions.length,
      totalPoints,
    };
  }

  async getPublishedExamForCandidate(session: MiniAppCandidateSession) {
    if (!session.departmentId || session.registrationStatus !== "approved") {
      return null;
    }

    const examSetResult = await this.supabase
      .from("exam_sets")
      .select(
        `
        id,
        title_en,
        description_en,
        duration_minutes,
        mode,
        departments:department_id(name_en)
      `,
      )
      .eq("department_id", session.departmentId)
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (examSetResult.error) {
      throw examSetResult.error;
    }

    if (!examSetResult.data) {
      return null;
    }

    const examSetRow = examSetResult.data as Record<string, any>;
    const examSetId = examSetRow.id as string;

    const questionLinks = await this.supabase
      .from("exam_set_questions")
      .select(
        `
        sort_order,
        points_override,
        questions:question_id(
          id,
          question_type,
          prompt_en,
          explanation_en,
          points,
          topics:topic_id(name_en),
          question_media(storage_path, sort_order),
          question_options(id, option_key, option_text_en, is_correct, sort_order)
        )
      `,
      )
      .eq("exam_set_id", examSetId)
      .order("sort_order", { ascending: true });

    if (questionLinks.error) {
      throw questionLinks.error;
    }

    const questions: ExamQuestion[] = [];

    for (const link of questionLinks.data ?? []) {
      const row = link as Record<string, any>;
      const question = row.questions as Record<string, any> | null;

      if (!question) {
        continue;
      }

      let imageUrl: string | undefined;
      const mediaRow = (question.question_media as Record<string, any>[] | null)?.[0];

      if (mediaRow?.storage_path) {
        if (String(mediaRow.storage_path).startsWith("http")) {
          imageUrl = mediaRow.storage_path as string;
        } else {
          const signed = await this.supabase.storage
            .from("question-media")
            .createSignedUrl(String(mediaRow.storage_path), 60 * 60);

          if (!signed.error) {
            imageUrl = signed.data.signedUrl;
          }
        }
      }

      questions.push({
        id: question.id as string,
        type: question.question_type,
        topic: (question.topics?.name_en as string | null) ?? "General",
        prompt: question.prompt_en as string,
        explanation:
          (question.explanation_en as string | null) ?? "No explanation yet.",
        points: Number(row.points_override ?? question.points ?? 1),
        imageUrl,
        options: ((question.question_options as Record<string, any>[] | null) ?? [])
          .sort((left, right) => Number(left.sort_order) - Number(right.sort_order))
          .map((option) => ({
            id: option.id as string,
            label: option.option_key as string,
            text: option.option_text_en as string,
            isCorrect: Boolean(option.is_correct),
          })),
      });
    }

    return {
      id: examSetId,
      title: examSetRow.title_en as string,
      department: (examSetRow.departments?.name_en as string | null) ?? "Aviation",
      durationMinutes: Number(examSetRow.duration_minutes),
      modeLabel:
        examSetRow.mode === "practice" ? "Practice Exam" : "Mock Exam",
      instructions: [
        "This exam was loaded from the live PostgreSQL question bank.",
        "Your timing and question navigation behave like the production exam flow.",
        "Image questions are delivered from secure storage when available.",
      ],
      questions,
    } satisfies ExamSet;
  }

  async saveExamAttempt(params: {
    candidateId: string;
    departmentId: string;
    examSet: ExamSet;
    session: any; // PersistedExamSession type from exam workbench
  }) {
    const { candidateId, departmentId, examSet, session } = params;

    if (!session.result) {
      throw new Error("Cannot save attempt without result.");
    }

    const timeSpentMs = (session.submittedAt ?? Date.now()) - (session.startedAt ?? Date.now());

    const attemptInsert = await this.supabase
      .from("exam_attempts")
      .insert({
        candidate_id: candidateId,
        exam_set_id: examSet.id,
        department_id: departmentId,
        status: "submitted",
        started_at: new Date(session.startedAt ?? Date.now()).toISOString(),
        expires_at: new Date(session.expiresAt ?? Date.now()).toISOString(),
        submitted_at: new Date(session.submittedAt ?? Date.now()).toISOString(),
        score: session.result.score,
        max_score: session.result.maxScore,
        correct_count: session.result.correctCount,
        incorrect_count: session.result.incorrectCount,
        unanswered_count: session.result.unansweredCount,
        time_spent_seconds: Math.max(0, Math.floor(timeSpentMs / 1000)),
      })
      .select("id")
      .single();

    if (attemptInsert.error) {
      throw attemptInsert.error;
    }

    const attemptId = attemptInsert.data.id;

    const answersData = examSet.questions.map((q) => {
      const selectedIds = session.answers[q.id] ?? [];
      const isFlagged = session.flags[q.id] ?? false;
      const isAnswered = selectedIds.length > 0;

      const correctOptionIds = q.options.filter((o: any) => o.isCorrect).map((o: any) => o.id);
      const isCorrect = isAnswered && 
        selectedIds.length === correctOptionIds.length && 
        selectedIds.every((id: string) => correctOptionIds.includes(id));

      return {
        exam_attempt_id: attemptId,
        question_id: q.id,
        selected_option_ids: selectedIds,
        is_flagged: isFlagged,
        is_answered: isAnswered,
        is_correct: isCorrect,
      };
    });

    if (answersData.length > 0) {
      const answersInsert = await this.supabase
        .from("attempt_answers")
        .insert(answersData);

      if (answersInsert.error) {
        throw answersInsert.error;
      }
    }

    return attemptId;
  }
}
