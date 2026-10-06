import type { ExamSet } from "@/features/exam/types";

const EXAM_CACHE_PREFIX = "eau_exam_v2_";
const EXAM_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedExamEntry {
  examSet: ExamSet;
  timestamp: number;
}

function buildCacheKey(deptId: string, examSetId: string, subjectName: string): string {
  return `${EXAM_CACHE_PREFIX}${deptId.toLowerCase().trim()}_${examSetId.toLowerCase().trim()}_${subjectName.toLowerCase().trim()}`;
}

/**
 * Retrieves a locally cached exam set for 0ms instant loading.
 */
export function getCachedExamSet(deptId: string, examSetId: string, subjectName: string): ExamSet | null {
  if (typeof window === "undefined") return null;
  try {
    const key = buildCacheKey(deptId, examSetId, subjectName);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CachedExamEntry = JSON.parse(raw);
    if (entry && entry.examSet && Array.isArray(entry.examSet.questions) && entry.examSet.questions.length > 0) {
      return entry.examSet;
    }
  } catch (e) {
    console.warn("Failed reading exam from local cache:", e);
  }
  return null;
}

/**
 * Saves an exam set into the client-side storage for instant offline access.
 */
export function saveCachedExamSet(deptId: string, examSetId: string, subjectName: string, examSet: ExamSet): void {
  if (typeof window === "undefined") return;
  try {
    const key = buildCacheKey(deptId, examSetId, subjectName);
    const entry: CachedExamEntry = {
      examSet,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    // If quota exceeded, clean up old cached items
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(EXAM_CACHE_PREFIX) && k !== buildCacheKey(deptId, examSetId, subjectName)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      const key = buildCacheKey(deptId, examSetId, subjectName);
      localStorage.setItem(key, JSON.stringify({ examSet, timestamp: Date.now() }));
    } catch {}
  }
}

/**
 * Background prefetch to warm up the cache so clicking Start Exam is instant.
 */
export async function prefetchExamSet(deptId: string, examSetId: string, subjectName: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (getCachedExamSet(deptId, examSetId, subjectName)) return;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch("/api/exams/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dept: deptId, subject: subjectName, examSetId }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.examSet?.questions?.length > 0) {
        saveCachedExamSet(deptId, examSetId, subjectName, data.examSet);
      }
    }
  } catch {}
}
