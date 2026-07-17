// ─── Departments ───────────────────────────────────────────────────────────────

export type PracticeSet = {
  id: string;
  label: string;     // "Practice 1", "Practice 2", …
  questionCount: number;
  durationMinutes: number; // 0 = untimed (practice)
  examSetId: string;
};

export type ExamSet = {
  id: string;
  label: string;     // "Exam 1", "Exam 2", …
  questionCount: number;
  durationMinutes: number;
  examSetId: string;
};

export type Department = {
  id: string;
  name: string;
  icon: string;
  description: string;
  practiceSets: PracticeSet[];
  examSets: ExamSet[];
};

function makePracticeSets(deptId: string): PracticeSet[] {
  return [1, 2, 3, 4].map((n) => ({
    id: `${deptId}-practice-${n}`,
    label: `Practice ${n}`,
    questionCount: 25,
    durationMinutes: 0,
    examSetId: `${deptId}-practice-set-${n}`,
  }));
}

function makeExamSets(deptId: string): ExamSet[] {
  return [1, 2, 3].map((n) => ({
    id: `${deptId}-exam-${n}`,
    label: `Exam ${n}`,
    questionCount: 60,
    durationMinutes: 60,
    examSetId: `${deptId}-exam-set-${n}`,
  }));
}

export const DEPARTMENTS: Department[] = [
  {
    id: "amt",
    name: "Aircraft Maintenance Technology",
    icon: "🔧",
    description: "Aircraft Maintenance Technology entrance exam preparation.",
    practiceSets: makePracticeSets("amt"),
    examSets: makeExamSets("amt"),
  },
  {
    id: "pilot",
    name: "Pilot Training",
    icon: "✈️",
    description: "Pilot Training program entrance exam preparation.",
    practiceSets: makePracticeSets("pilot"),
    examSets: makeExamSets("pilot"),
  },
  {
    id: "cabin",
    name: "Cabin Crew",
    icon: "🛎️",
    description: "Cabin Crew program entrance exam preparation.",
    practiceSets: makePracticeSets("cabin"),
    examSets: makeExamSets("cabin"),
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "📢",
    description: "Marketing department entrance exam preparation.",
    practiceSets: makePracticeSets("marketing"),
    examSets: makeExamSets("marketing"),
  },
  {
    id: "others",
    name: "Others",
    icon: "🎓",
    description: "Other departments and programmes — general entrance exam preparation.",
    practiceSets: makePracticeSets("others"),
    examSets: makeExamSets("others"),
  },
];

export function getDepartment(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}
