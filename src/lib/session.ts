// ─── Student Session (localStorage-backed) ───────────────────────────────────

export type StudentSession = {
  id: string;
  name: string;
  studentId: string;
  department: string;
  avatarInitials: string;
  loginAt: number;
  isApproved?: boolean;
  isAdmin?: boolean;
  registrationStatus?: string;
};

export type ExamHistoryEntry = {
  id: string;
  subject: string;
  department: string;
  mode: "practice" | "exam";
  percentage: number;
  durationSeconds: number;
  completedAt: number;
  examSetId: string;
};

const SESSION_KEY = "eau-student-session";
const HISTORY_KEY = "eau-exam-history";

export function saveSession(session: StudentSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

export function loadSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudentSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function saveHistoryEntry(entry: ExamHistoryEntry): void {
  try {
    const existing = loadHistory();
    const updated = [entry, ...existing].slice(0, 50); // keep last 50
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

export function loadHistory(): ExamHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ExamHistoryEntry[];
  } catch {
    return [];
  }
}

export function getAllowedDepartmentId(department: string | null | undefined): string | null {
  const value = (department ?? "").trim().toLowerCase();

  if (!value) return null;
  if (value.includes("amt") || value.includes("maintenance") || value.includes("technician")) return "amt";
  if (value.includes("pilot")) return "pilot";
  if (value.includes("cabin")) return "cabin";
  if (value.includes("marketing") || value.includes("aviation management")) return "marketing";
  if (value.includes("other")) return "others";

  return null;
}

// ─── Mock login ───────────────────────────────────────────────────────────────

type MockStudent = {
  studentId: string;
  password: string;
  name: string;
  department: string;
};

const MOCK_STUDENTS: MockStudent[] = [
  { studentId: "EAU-2024-001", password: "student1", name: "Abebe Girma",     department: "Aircraft Maintenance Technician" },
  { studentId: "EAU-2024-002", password: "student2", name: "Selamawit Tesfaye", department: "Pilot Training" },
  { studentId: "EAU-2024-003", password: "student3", name: "Yohannes Alemu",  department: "Cabin Crew" },
  { studentId: "EAU-2024-004", password: "student4", name: "Hiwot Bekele",    department: "Aviation Management" },
  { studentId: "EAU-2024-005", password: "student5", name: "Tigist Haile",    department: "Others" },
  { studentId: "demo",         password: "demo",     name: "Demo Student",    department: "Aircraft Maintenance Technician" },
];

export function mockLogin(
  studentId: string,
  password: string,
): StudentSession | null {
  const student = MOCK_STUDENTS.find(
    (s) => s.studentId.toLowerCase() === studentId.toLowerCase() && s.password === password,
  );
  if (!student) return null;

  const initials = student.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const session: StudentSession = {
    id: crypto.randomUUID(),
    name: student.name,
    studentId: student.studentId,
    department: student.department,
    avatarInitials: initials,
    loginAt: Date.now(),
  };
  return session;
}
