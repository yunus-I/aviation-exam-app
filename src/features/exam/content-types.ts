import type { ExamMode, QuestionType } from "@/types/db";

export type ContentImportOption = {
  key: string;
  text: string;
  isCorrect: boolean;
};

export type ContentImportQuestion = {
  key: string;
  topicSlug?: string;
  type: QuestionType;
  prompt: string;
  explanation?: string;
  sourceLabel?: string;
  sourceYear?: number;
  imageStoragePath?: string;
  options: ContentImportOption[];
};

export type ContentImportPayload = {
  questionBank: {
    key: string;
    slug: string;
    title: string;
    description?: string;
    departmentCode: string;
    topicSlug?: string;
  };
  examSet: {
    key: string;
    slug: string;
    title: string;
    description?: string;
    departmentCode: string;
    topicSlug?: string;
    mode: ExamMode;
    durationMinutes: number;
    published?: boolean;
  };
  questions: ContentImportQuestion[];
};
