import type { QuestionType } from "@/types/db";

export type ExamQuestionOption = {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
};

export type ExamQuestion = {
  id: string;
  type: QuestionType;
  topic: string;
  prompt: string;
  explanation: string;
  imageUrl?: string;
  options: ExamQuestionOption[];
};

export type ExamSet = {
  id: string;
  title: string;
  subject: string;
  department: string;
  durationMinutes: number;
  modeLabel: string;
  instructions: string[];
  questions: ExamQuestion[];
};

export type ExamAnswerMap = Record<string, string[]>;
export type ExamFlagMap = Record<string, boolean>;

export type ExamResult = {
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  percentage: number;
};

export type PersistedExamSession = {
  version: number;
  stage: "intro" | "active" | "submitted";
  currentIndex: number;
  startedAt: number | null;
  expiresAt: number | null;
  remainingSeconds: number;
  answers: ExamAnswerMap;
  flags: ExamFlagMap;
  result: ExamResult | null;
  submittedAt: number | null;
};
