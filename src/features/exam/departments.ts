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

export type NoteSet = {
  id: string;
  label: string;     // "Note 1", "Note 2", …
  noteId: string;
};

export type Department = {
  id: string;
  name: string;
  icon: string;
  description: string;
  practiceSets: PracticeSet[];
  examSets: ExamSet[];
  noteSets: NoteSet[];
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

function getExamSetImportKey(deptId: string, examNumber: number): string {
  if (deptId === "pilot" && examNumber === 3) {
    return "pilot-training-exam-3";
  }

  return `${deptId}-exam-set-${examNumber}`;
}

function makeExamSets(deptId: string): ExamSet[] {
  return [1, 2, 3].map((n) => ({
    id: `${deptId}-exam-${n}`,
    label: `Exam ${n}`,
    questionCount: 60,
    durationMinutes: 60,
    examSetId: getExamSetImportKey(deptId, n),
  }));
}

function makeNoteSets(deptId: string): NoteSet[] {
  return [1, 2, 3, 4].map((n) => ({
    id: `${deptId}-note-${n}`,
    label: `Note ${n}`,
    noteId: `${deptId}-note-${n}`,
  }));
}

export const DEPARTMENTS: Department[] = [
  {
    id: "amt",
    name: "Aircraft Maintenance Technician",
    icon: "🔧",
    description: "Aircraft Maintenance Technician entrance exam preparation.",
    practiceSets: makePracticeSets("amt"),
    examSets: makeExamSets("amt"),
    noteSets: makeNoteSets("amt"),
  },
  {
    id: "pilot",
    name: "Pilot Training",
    icon: "✈️",
    description: "Pilot Training program entrance exam preparation.",
    practiceSets: makePracticeSets("pilot"),
    examSets: makeExamSets("pilot"),
    noteSets: makeNoteSets("pilot"),
  },
  {
    id: "cabin",
    name: "Cabin Crew",
    icon: "🛎️",
    description: "Cabin Crew program entrance exam preparation.",
    practiceSets: makePracticeSets("cabin"),
    examSets: makeExamSets("cabin"),
    noteSets: makeNoteSets("cabin"),
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "📢",
    description: "Marketing department entrance exam preparation.",
    practiceSets: makePracticeSets("marketing"),
    examSets: makeExamSets("marketing"),
    noteSets: makeNoteSets("marketing"),
  },
  {
    id: "others",
    name: "Others",
    icon: "🎓",
    description: "Other departments and programmes — general entrance exam preparation.",
    practiceSets: makePracticeSets("others"),
    examSets: makeExamSets("others"),
    noteSets: makeNoteSets("others"),
  },
];

export function getDepartment(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}
