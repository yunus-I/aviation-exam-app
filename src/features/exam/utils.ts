import type { ExamQuestion, ExamResult } from "@/features/exam/types";

export function formatExamTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function calculateExamResult(
  questions: ExamQuestion[],
  answers: Record<string, string[]>,
): ExamResult {
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const question of questions) {
    const selected = [...(answers[question.id] ?? [])].sort();
    const correct = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option.id)
      .sort();

    if (selected.length === 0) {
      unansweredCount += 1;
      continue;
    }

    const isCorrect =
      selected.length === correct.length &&
      selected.every((value, index) => value === correct[index]);

    if (isCorrect) {
      correctCount += 1;
      score += question.points;
    } else {
      incorrectCount += 1;
    }
  }

  const maxScore = questions.reduce((sum, question) => sum + question.points, 0);
  const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);

  return {
    score,
    maxScore,
    correctCount,
    incorrectCount,
    unansweredCount,
    percentage,
  };
}
