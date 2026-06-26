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
    description:
      "Aircraft systems, avionics, structural repair, and airworthiness regulations for licensed AMTs.",
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
    id: "mgmt",
    name: "Aviation Management",
    icon: "📊",
    description:
      "Airport operations, airline economics, logistics, and aviation industry regulations.",
    subjects: [
      { id: "mgmt-maths",    name: "Mathematics", questionCount: 2, durationMinutes: 18, examSetId: "demo-maths-2026" },
      { id: "mgmt-english",  name: "English",     questionCount: 2, durationMinutes: 18, examSetId: "demo-english-2026" },
      { id: "mgmt-aptitude", name: "Aptitude",    questionCount: 2, durationMinutes: 18, examSetId: "demo-aptitude-2026" },
    ],
  },
  {
    id: "aero",
    name: "Aeronautical Engineering",
    icon: "🛩️",
    description:
      "Aerodynamics, propulsion systems, structures, and aerospace design fundamentals.",
    subjects: [
      { id: "aero-maths",    name: "Mathematics",  questionCount: 2, durationMinutes: 18, examSetId: "demo-maths-2026" },
      { id: "aero-mech",     name: "Mechanical",   questionCount: 2, durationMinutes: 18, examSetId: "demo-mechanical-2026" },
      { id: "aero-aptitude", name: "Aptitude",     questionCount: 2, durationMinutes: 18, examSetId: "demo-aptitude-2026" },
    ],
  },
  {
    id: "atc",
    name: "Air Traffic Control",
    icon: "📡",
    description:
      "Radar operations, communication procedures, separation standards, and ATC regulations.",
    subjects: [
      { id: "atc-aptitude", name: "Aptitude",  questionCount: 2, durationMinutes: 18, examSetId: "demo-aptitude-2026" },
      { id: "atc-maths",    name: "Mathematics", questionCount: 2, durationMinutes: 18, examSetId: "demo-maths-2026" },
      { id: "atc-english",  name: "English",     questionCount: 2, durationMinutes: 18, examSetId: "demo-english-2026" },
    ],
  },
];

export function getDepartment(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}
