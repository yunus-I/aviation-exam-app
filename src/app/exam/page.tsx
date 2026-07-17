"use client";

import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadSession } from "@/lib/session";
import { saveHistoryEntry } from "@/lib/session";
import { DEMO_EXAM_SETS, DEMO_EXAM_SET } from "@/features/exam/mock-data";
import { calculateExamResult, formatExamTime } from "@/features/exam/utils";
import type { ExamQuestion, ExamSet, ExamAnswerMap, ExamFlagMap } from "@/features/exam/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "active" | "submitted";

type ExamState = {
  stage: Stage;
  currentIndex: number;
  answers: ExamAnswerMap;
  flags: ExamFlagMap;
  startedAt: number;
  submittedAt: number | null;
  remainingSeconds: number;
  feedbackShown: boolean; // for practice mode
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="lightbox__img"
        src={src}
        alt="Question illustration — zoomed"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="lightbox__close"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Option Card ──────────────────────────────────────────────────────────────

function OptionCard({
  label,
  text,
  isSelected,
  isCorrect,
  isWrong,
  isCorrectHighlight,
  isTrueFalse,
  onClick,
  disabled,
}: {
  label: string;
  text: string;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  isCorrectHighlight: boolean;
  isTrueFalse: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  let cls = "exam-option";
  if (isCorrect) cls += " exam-option--correct";
  else if (isWrong) cls += " exam-option--wrong";
  else if (isCorrectHighlight) cls += " exam-option--correct-highlight";
  else if (isSelected) cls += " exam-option--selected";

  const checkIcon = isCorrect || isCorrectHighlight ? "✓" : isWrong ? "✗" : isSelected ? "✓" : null;

  return (
    <button
      className={cls}
      onClick={onClick}
      disabled={disabled}
      type="button"
      style={isTrueFalse ? { flex: 1, justifyContent: "center", fontSize: 16, fontWeight: 600 } : {}}
    >
      <span className="exam-option__letter">{label}</span>
      <span className="exam-option__text">{text}</span>
      {checkIcon && <span className="exam-option__check">{checkIcon}</span>}
    </button>
  );
}

// ─── Main exam component ───────────────────────────────────────────────────────

function ExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const examSetId  = searchParams.get("set")  ?? DEMO_EXAM_SET.id;
  const examMode   = (searchParams.get("mode") ?? "practice") as "practice" | "exam";
  const deptId     = searchParams.get("dept") ?? "amt";
  const subjectName = searchParams.get("subject") ?? "Practice";

  const [ready, setReady] = useState(false);
  const [examSet, setExamSet] = useState<ExamSet>(DEMO_EXAM_SET);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [openReviewIdx, setOpenReviewIdx] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const [state, setState] = useState<ExamState>(() => ({
    stage: "active",
    currentIndex: 0,
    answers: {},
    flags: {},
    startedAt: Date.now(),
    submittedAt: null,
    remainingSeconds: DEMO_EXAM_SET.durationMinutes * 60,
    feedbackShown: false,
  }));



  // Load exam set & session
  useEffect(() => {
    const session = loadSession();
    if (!session) { router.replace("/"); return; }

    setReady(false);
    
    // Attempt to load from live Supabase endpoint first
    fetch("/api/exams/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dept: deptId, subject: subjectName }),
    })
      .then(async (res) => {
        const payload = await res.json();
        if (payload.ok && payload.examSet && payload.examSet.questions.length > 0) {
          setExamSet(payload.examSet);
          setState({
            stage: "active",
            currentIndex: 0,
            answers: {},
            flags: {},
            startedAt: Date.now(),
            submittedAt: null,
            remainingSeconds: payload.examSet.durationMinutes * 60,
            feedbackShown: false,
          });
        } else {
          // Fall back to demo data
          const found = DEMO_EXAM_SETS.find((s) => s.id === examSetId) ?? DEMO_EXAM_SET;
          setExamSet(found);
          setState({
            stage: "active",
            currentIndex: 0,
            answers: {},
            flags: {},
            startedAt: Date.now(),
            submittedAt: null,
            remainingSeconds: found.durationMinutes * 60,
            feedbackShown: false,
          });
        }
      })
      .catch(() => {
        // Fall back on error
        const found = DEMO_EXAM_SETS.find((s) => s.id === examSetId) ?? DEMO_EXAM_SET;
        setExamSet(found);
        setState({
          stage: "active",
          currentIndex: 0,
          answers: {},
          flags: {},
          startedAt: Date.now(),
          submittedAt: null,
          remainingSeconds: found.durationMinutes * 60,
          feedbackShown: false,
        });
      })
      .finally(() => {
        setReady(true);
      });
  }, [examSetId, router, deptId, subjectName]);

  // Countdown timer
  useEffect(() => {
    if (!ready || state.stage !== "active" || examMode === "practice") return;
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.stage !== "active") return prev;
        const next = Math.max(0, prev.remainingSeconds - 1);
        if (next === 0) {
          return { ...prev, remainingSeconds: 0, stage: "submitted", submittedAt: Date.now() };
        }
        return { ...prev, remainingSeconds: next };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [ready, state.stage, examMode]);

  // Save history when submitted
  useEffect(() => {
    if (state.stage !== "submitted" || !state.submittedAt) return;
    const session = loadSession();
    if (!session) return;
    const result = calculateExamResult(examSet.questions, state.answers);
    const durationSec = Math.round((state.submittedAt - state.startedAt) / 1000);
    saveHistoryEntry({
      id: crypto.randomUUID(),
      subject: subjectName,
      department: deptId,
      mode: examMode,
      percentage: result.percentage,
      durationSeconds: durationSec,
      completedAt: state.submittedAt,
      examSetId: examSet.id,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stage]);

  // ─── Derived ────────────────────────────────────────────────────────────────

  const questions = examSet.questions;
  const currentQ = questions[state.currentIndex];
  const selectedIds = currentQ ? (state.answers[currentQ.id] ?? []) : [];
  const hasSelected = selectedIds.length > 0;
  const answered = useMemo(
    () => Object.values(state.answers).filter((a) => a.length > 0).length,
    [state.answers],
  );
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0;
  const isTimed = examMode !== "practice" && examSet.durationMinutes > 0;
  const timerWarning = isTimed && state.remainingSeconds < 120;

  // Compute result for submitted state
  const result = useMemo(
    () => (state.stage === "submitted" ? calculateExamResult(questions, state.answers) : null),
    [state.stage, questions, state.answers],
  );

  // Per-question feedback (practice mode only)
  const showFeedback = examMode === "practice" && state.feedbackShown && hasSelected;

  function getOptionState(q: ExamQuestion, optId: string, optIsCorrect: boolean) {
    const sel = state.answers[q.id] ?? [];
    const isSel = sel.includes(optId);
    if (!showFeedback) {
      return { isSelected: isSel, isCorrect: false, isWrong: false, isCorrectHighlight: false };
    }
    // After feedback shown
    if (isSel && optIsCorrect) return { isSelected: false, isCorrect: true, isWrong: false, isCorrectHighlight: false };
    if (isSel && !optIsCorrect) return { isSelected: false, isCorrect: false, isWrong: true, isCorrectHighlight: false };
    if (!isSel && optIsCorrect) return { isSelected: false, isCorrect: false, isWrong: false, isCorrectHighlight: true };
    return { isSelected: false, isCorrect: false, isWrong: false, isCorrectHighlight: false };
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  const selectOption = useCallback((q: ExamQuestion, optId: string) => {
    if (showFeedback) return; // locked after feedback
    if (state.stage !== "active") return;
    setState((prev) => {
      const existing = prev.answers[q.id] ?? [];
      let next: string[];
      if (q.type === "multiple_choice") {
        next = existing.includes(optId)
          ? existing.filter((x) => x !== optId)
          : [...existing, optId];
      } else {
        next = [optId];
      }
      return {
        ...prev,
        answers: { ...prev.answers, [q.id]: next },
        feedbackShown: examMode === "practice" ? true : false,
      };
    });
  }, [showFeedback, state.stage, examMode]);

  const confirmAnswer = useCallback(() => {
    // Practice mode: show feedback
    setState((prev) => ({ ...prev, feedbackShown: true }));
  }, []);

  const nextQuestion = useCallback(() => {
    setShowExplanation(false);
    setState((prev) => ({
      ...prev,
      currentIndex: Math.min(questions.length - 1, prev.currentIndex + 1),
      feedbackShown: false,
    }));
  }, [questions.length, setShowExplanation]);

  const prevQuestion = useCallback(() => {
    setShowExplanation(false);
    setState((prev) => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
      feedbackShown: false,
    }));
  }, [setShowExplanation]);

  const jumpToQuestion = useCallback((idx: number) => {
    setShowExplanation(false);
    setState((prev) => ({ ...prev, currentIndex: idx, feedbackShown: false }));
  }, [setShowExplanation]);

  const toggleFlag = useCallback((qId: string) => {
    setState((prev) => ({
      ...prev,
      flags: { ...prev.flags, [qId]: !prev.flags[qId] },
    }));
  }, []);

  const submitExam = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stage: "submitted",
      submittedAt: Date.now(),
      feedbackShown: false,
    }));
    setShowSubmitConfirm(false);
  }, []);

  // Feedback verdict
  function getFeedbackVerdict() {
    if (!currentQ || !showFeedback) return null;
    const sel = state.answers[currentQ.id] ?? [];
    if (sel.length === 0) return "skipped";
    const correctOpts = currentQ.options.filter((o) => o.isCorrect).map((o) => o.id).sort();
    const selSorted = [...sel].sort();
    const isCorrect = JSON.stringify(correctOpts) === JSON.stringify(selSorted);
    return isCorrect ? "correct" : "wrong";
  }
  const verdict = getFeedbackVerdict();

  // Topic performance for results
  const topicMap = useMemo(() => {
    if (state.stage !== "submitted") return {};
    const map: Record<string, { correct: number; total: number }> = {};
    for (const q of questions) {
      if (!map[q.topic]) map[q.topic] = { correct: 0, total: 0 };
      map[q.topic].total += 1;
      const r = calculateExamResult([q], { [q.id]: state.answers[q.id] ?? [] });
      if (r.correctCount > 0) map[q.topic].correct += 1;
    }
    return map;
  }, [state.stage, questions, state.answers]);

  const durationSeconds = state.submittedAt
    ? Math.round((state.submittedAt - state.startedAt) / 1000)
    : Math.round((Date.now() - state.startedAt) / 1000);

  // ─── SUBMITTED / RESULTS VIEW ────────────────────────────────────────────────

  if (state.stage === "submitted" && result) {
    const pct = result.percentage;
    const passed = pct >= 50;

    // Weakest topic
    const topicEntries = Object.entries(topicMap);
    const weakest = topicEntries.sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))[0];

    return (
      <>
        {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

        {/* Minimal navbar */}
        <header className="exam-navbar" style={{ position: "sticky", top: 0, zIndex: 100 }}>
          <div className="exam-navbar__brand">
            <div className="exam-navbar__logo">EAU</div>
          </div>
          <div className="exam-navbar__title">
            {subjectName} — Results
          </div>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => router.push(`/subjects?dept=${deptId}`)}
            style={{ fontSize: 13, padding: "6px 14px" }}
          >
            ← Back
          </button>
        </header>

        <div className="results-page">
          {/* Score hero */}
          <div className="results-hero">
            <div className={`results-verdict ${passed ? "results-verdict--pass" : "results-verdict--fail"}`}>
              {passed ? "✅ Well done!" : "❌ Keep practicing"}
            </div>
            {weakest && (
              <p className="results-message" style={{ marginTop: 8 }}>
                {passed
                  ? `Great effort! ${weakest[1].correct === weakest[1].total ? "You aced every topic!" : `Focus on ${weakest[0]} to improve further.`}`
                  : `Keep going! Spend extra time on ${weakest[0]} — you'll get there.`}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="results-stats">
            <div className="results-stat">
              <div className="results-stat__icon">✅</div>
              <div className="results-stat__val" style={{ color: "var(--success)" }}>{result.correctCount}</div>
              <div className="results-stat__label">Correct</div>
            </div>
            <div className="results-stat">
              <div className="results-stat__icon">❌</div>
              <div className="results-stat__val" style={{ color: "var(--error)" }}>{result.incorrectCount}</div>
              <div className="results-stat__label">Wrong</div>
            </div>
            <div className="results-stat">
              <div className="results-stat__icon">⏭</div>
              <div className="results-stat__val" style={{ color: "var(--neutral)" }}>{result.unansweredCount}</div>
              <div className="results-stat__label">Skipped</div>
            </div>
          </div>

          {/* Question Review */}
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Question Review</div>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => setOpenReviewIdx(openReviewIdx !== null ? null : 0)}
            >
              {openReviewIdx !== null ? "Collapse all" : "Expand all"}
            </button>
          </div>
          <div className="review-list">
            {questions.map((q, idx) => {
              const sel = state.answers[q.id] ?? [];
              const qResult = calculateExamResult([q], { [q.id]: sel });
              const isCorrect = qResult.correctCount > 0;
              const isSkipped = sel.length === 0;
              const isOpen = openReviewIdx === idx || openReviewIdx === 0;
              const correctOpts = q.options.filter((o) => o.isCorrect);
              const selectedOpts = q.options.filter((o) => sel.includes(o.id));

              return (
                <div
                  key={q.id}
                  className={`review-item ${isSkipped ? "review-item--skipped" : isCorrect ? "review-item--correct" : "review-item--wrong"}`}
                  id={`review-${idx}`}
                >
                  <div
                    className="review-item__header"
                    onClick={() => setOpenReviewIdx(isOpen ? null : idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setOpenReviewIdx(isOpen ? null : idx)}
                  >
                    <span className="review-item__q-label">Q{idx + 1}</span>
                    <span className="review-item__q-text">{q.prompt}</span>
                    <span className="review-item__status">
                      {isSkipped ? "⏭" : isCorrect ? "✅" : "❌"}
                    </span>
                    <span className={`review-item__chevron ${isOpen ? "review-item__chevron--open" : ""}`}>▾</span>
                  </div>
                  {isOpen && (
                    <div className="review-item__body">
                      {q.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="review-img" src={q.imageUrl} alt={`Q${idx + 1} illustration`} />
                      )}
                      <p className="review-prompt">{q.prompt}</p>
                      <div className="review-answers">
                        {selectedOpts.length > 0 && (
                          <div className={`review-answer ${isCorrect ? "review-answer--correct" : "review-answer--wrong"}`}>
                            <span>{isCorrect ? "✓" : "✗"}</span>
                            Your answer: {selectedOpts.map((o) => `${o.label}. ${o.text}`).join(", ")}
                          </div>
                        )}
                        {!isCorrect && (
                          <div className="review-answer review-answer--correct">
                            <span>✓</span>
                            Correct: {correctOpts.map((o) => `${o.label}. ${o.text}`).join(", ")}
                          </div>
                        )}
                      </div>
                      <div className="review-explanation">
                        💡 {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTAs */}
          <div className="results-ctas">
            <button
              id="retry-exam-btn"
              className="btn btn--primary btn--lg"
              onClick={() => {
                setState({
                  stage: "active",
                  currentIndex: 0,
                  answers: {},
                  flags: {},
                  startedAt: Date.now(),
                  submittedAt: null,
                  remainingSeconds: examSet.durationMinutes * 60,
                  feedbackShown: false,
                });
              }}
            >
              🔄 Retry This Exam
            </button>
            <button
              id="back-subjects-btn"
              className="btn btn--secondary btn--lg"
              onClick={() => router.push(`/subjects?dept=${deptId}`)}
            >
              ← Back to Subjects
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── ACTIVE EXAM VIEW ────────────────────────────────────────────────────────

  if (!ready || !currentQ) {
    return (
      <div className="loading-center" style={{ minHeight: "100vh" }}>
        <div className="spinner" />
        <span>Loading exam…</span>
      </div>
    );
  }

  const isTF = currentQ.type === "true_false";

  return (
    <>
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}

      {/* Back confirm overlay */}
      {showBackConfirm && (
        <div className="lightbox" style={{ flexDirection: "column", gap: 24 }} onClick={() => setShowBackConfirm(false)}>
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              padding: "32px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "var(--shadow-xl)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", color: "var(--brand)", marginBottom: 8 }}>
              Leave Exam?
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.65, marginBottom: 24 }}>
              Your current exam progress will be <strong>lost</strong> if you leave now. Are you sure?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn--ghost btn--full" onClick={() => setShowBackConfirm(false)}>Stay in Exam</button>
              <button
                id="confirm-back-btn"
                className="btn btn--primary btn--full"
                style={{ background: "var(--error)", borderColor: "var(--error)" }}
                onClick={() => router.push(`/subjects?dept=${deptId}`)}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit confirm overlay */}
      {showSubmitConfirm && (
        <div className="lightbox" style={{ flexDirection: "column", gap: 24 }} onClick={() => setShowSubmitConfirm(false)}>
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              padding: "32px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "var(--shadow-xl)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", color: "var(--brand)", marginBottom: 8 }}>
              Submit Exam?
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.65, marginBottom: 24 }}>
              You have answered <strong>{answered}</strong> of <strong>{questions.length}</strong> questions.
              {answered < questions.length && ` ${questions.length - answered} question${questions.length - answered > 1 ? "s" : ""} unanswered.`}{" "}
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn--ghost btn--full" onClick={() => setShowSubmitConfirm(false)}>Continue Exam</button>
              <button id="confirm-submit-btn" className="btn btn--primary btn--full" onClick={submitExam}>Submit Now</button>
            </div>
          </div>
        </div>
      )}

      <div className="exam-shell">
        {/* Navbar */}
        <header className="exam-navbar">
          <div className="exam-navbar__brand">
            <div className="exam-navbar__logo">EAU</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginLeft: 6 }}>
              {examMode === "practice" ? "Practice" : "Exam"} Mode
            </div>
          </div>
          <div className="exam-navbar__title">
            {examSet.department} — {subjectName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isTimed ? (
              <div className={`exam-navbar__timer ${timerWarning ? "exam-navbar__timer--warning" : ""}`}>
                ⏱ {formatExamTime(state.remainingSeconds)}
              </div>
            ) : null}
            <button
              id="back-exam-btn"
              className="btn btn--ghost btn--sm"
              onClick={() => setShowBackConfirm(true)}
              style={{ fontSize: 13, padding: "6px 14px", flexShrink: 0 }}
            >
              ← Back
            </button>
          </div>
        </header>

        {/* Gold progress bar */}
        <div className="exam-progress-bar-wrap">
          <div className="exam-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        {/* Body */}
        <div className="exam-body">
          <div className="exam-question-wrap">
            {/* Counter */}
            <div className="exam-counter">
              Question {state.currentIndex + 1} of {questions.length}
              {Object.values(state.flags).filter(Boolean).length > 0 && (
                <span style={{ marginLeft: 12, color: "var(--accent)" }}>
                  🚩 {Object.values(state.flags).filter(Boolean).length} flagged
                </span>
              )}
            </div>

            {/* Question card */}
            <div className="exam-question-card">
              {/* Top bar */}
              <div className="exam-question-card__topbar">
                <div className="exam-question-card__meta">
                  <div className="exam-question-card__topic">{currentQ.topic}</div>
                  <div className="exam-question-card__num">
                    Q{state.currentIndex + 1}
                    {isTF && <span style={{ marginLeft: 8 }} className="badge badge--neutral">True / False</span>}
                    {currentQ.type === "multiple_choice" && <span style={{ marginLeft: 8 }} className="badge badge--navy">Multi-select</span>}
                  </div>
                </div>
                <button
                  id={`flag-btn-${state.currentIndex}`}
                  className={`exam-flag-btn ${state.flags[currentQ.id] ? "exam-flag-btn--active" : ""}`}
                  onClick={() => toggleFlag(currentQ.id)}
                >
                  🚩 {state.flags[currentQ.id] ? "Flagged" : "Flag"}
                </button>
              </div>

              {/* Question image */}
              {currentQ.imageUrl && (
                <div className="exam-img-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="exam-img"
                    src={currentQ.imageUrl}
                    alt={`Illustration for Q${state.currentIndex + 1}`}
                  />
                  <button
                    className="exam-img-zoom"
                    onClick={() => setLightboxSrc(currentQ.imageUrl!)}
                    aria-label="Zoom image"
                  >
                    🔍 Zoom
                  </button>
                </div>
              )}

              {/* Prompt */}
              <p className="exam-prompt">{currentQ.prompt}</p>

              {/* Options */}
              <div className={`exam-options ${isTF ? "exam-options--tf" : ""}`}>
                {currentQ.options.map((opt) => {
                  const { isSelected, isCorrect, isWrong, isCorrectHighlight } = getOptionState(currentQ, opt.id, opt.isCorrect);
                  return (
                    <OptionCard
                      key={opt.id}
                      label={opt.label}
                      text={opt.text}
                      isSelected={isSelected}
                      isCorrect={isCorrect}
                      isWrong={isWrong}
                      isCorrectHighlight={isCorrectHighlight}
                      isTrueFalse={isTF}
                      onClick={() => selectOption(currentQ, opt.id)}
                      disabled={showFeedback}
                    />
                  );
                })}
              </div>

              {/* Feedback card */}
              {showFeedback && verdict && (
                <div className={`exam-feedback exam-feedback--${verdict}`} style={{ marginTop: 16 }}>
                  <div className="exam-feedback__title">
                    {verdict === "correct" ? "✅ Correct!" : verdict === "wrong" ? "❌ Incorrect" : "⏭ Skipped"}
                  </div>
                  {!showExplanation ? (
                    <div style={{ marginTop: 8 }}>
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => setShowExplanation(true)}
                        type="button"
                      >
                        Show Explanation
                      </button>
                    </div>
                  ) : (
                    <div className="exam-feedback__text" style={{ marginTop: 8 }}>
                      {currentQ.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit row */}
            <div className="exam-submit-row">
              <button
                id="submit-exam-btn"
                className="btn btn--secondary"
                onClick={() => setShowSubmitConfirm(true)}
                style={{ marginLeft: "auto" }}
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="exam-bottombar">
          <button
            id="prev-question-btn"
            className="btn btn--ghost btn--sm exam-bottombar__prev"
            disabled={state.currentIndex === 0}
            onClick={prevQuestion}
          >
            ← Prev
          </button>

          {/* Dot grid */}
          <div className="exam-dot-grid">
            {questions.map((q, idx) => {
              const isAnswered = (state.answers[q.id] ?? []).length > 0;
              const isFlagged = Boolean(state.flags[q.id]);
              const isCurrent = idx === state.currentIndex;
              let cls = "exam-dot";
              if (isFlagged) cls += " exam-dot--flagged";
              else if (isAnswered) cls += " exam-dot--answered";
              if (isCurrent) cls += " exam-dot--current";
              return (
                <button
                  key={q.id}
                  id={`dot-${idx}`}
                  className={cls}
                  onClick={() => jumpToQuestion(idx)}
                  title={`Q${idx + 1}${isAnswered ? " (answered)" : ""}${isFlagged ? " (flagged)" : ""}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            id="next-question-btn"
            className="btn btn--primary btn--sm exam-bottombar__next"
            disabled={state.currentIndex === questions.length - 1}
            onClick={nextQuestion}
          >
            Next →
          </button>
        </div>
      </div>
    </>
  );
}

export default function ExamPage() {
  return (
    <Suspense
      fallback={
        <div className="loading-center" style={{ minHeight: "100vh" }}>
          <div className="spinner" />
          <span>Loading exam…</span>
        </div>
      }
    >
      <ExamContent />
    </Suspense>
  );
}
