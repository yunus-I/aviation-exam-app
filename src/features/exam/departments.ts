// ─── Departments & Subjects ───────────────────────────────────────────────────

export type Subject = {
  id: string;
  name: string;
  questionCount: number;
  durationMinutes: number;
  examSetId: string;
};

export type Department = {
  id: string;
  name: string;
  icon: string;
  description: string;
  subjects: Subject[];
};

export const DEPARTMENTS: Department[] = [
  {
    id: "amt",
    name: "Aircraft Maintenance Technology",
    icon: "🔧",
    description: "",
    subjects: [
      { id: "amt-mechanical", name: "Mechanical Reasoning", questionCount: 2, durationMinutes: 18, examSetId: "demo-mechanical-2026" },
      { id: "amt-english",    name: "English Proficiency",  questionCount: 2, durationMinutes: 18, examSetId: "demo-english-2026" },
      { id: "amt-aptitude",   name: "Aptitude Test",        questionCount: 2, durationMinutes: 18, examSetId: "demo-aptitude-2026" },
      { id: "amt-maths",      name: "Mathematics",          questionCount: 2, durationMinutes: 18, examSetId: "demo-maths-2026" },
    ],
  },
  {
    id: "pilot",
    name: "Pilot Training",
    icon: "✈️",
    description:
      "Aerodynamics, navigation, meteorology, air law, and flight instruments for aspiring pilots.",
    subjects: [
      { id: "pilot-maths",    name: "Mathematics",     questionCount: 2, durationMinutes: 18, examSetId: "demo-maths-2026" },
      { id: "pilot-english",  name: "English",         questionCount: 2, durationMinutes: 18, examSetId: "demo-english-2026" },
      { id: "pilot-aptitude", name: "Aptitude",        questionCount: 2, durationMinutes: 18, examSetId: "demo-aptitude-2026" },
    ],
  },
  {
    id: "cabin",
    name: "Cabin Crew",
    icon: "🛎️",
    description:
      "Passenger safety, first aid, service excellence, and emergency procedures for future cabin crew.",
    subjects: [
      { id: "cabin-english",  name: "English Proficiency", questionCount: 2, durationMinutes: 18, examSetId: "demo-english-2026" },
      { id: "cabin-aptitude", name: "Aptitude",            questionCount: 2, durationMinutes: 18, examSetId: "demo-aptitude-2026" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: "📢",
    description:
      "Business basics, quantitative reasoning, communication, and exam-focused drills.",
    subjects: [
      { id: "marketing-maths",    name: "Mathematics",          questionCount: 2, durationMinutes: 18, examSetId: "demo-maths-2026" },
      { id: "marketing-english",  name: "English Proficiency",  questionCount: 2, durationMinutes: 18, examSetId: "demo-english-2026" },
      { id: "marketing-aptitude", name: "Aptitude Test",        questionCount: 2, durationMinutes: 18, examSetId: "demo-aptitude-2026" },
    ],
  },
];

export function getDepartment(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}
