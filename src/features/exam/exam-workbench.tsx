"use client";

import { useEffect, useMemo, useState } from "react";
import { DEMO_EXAM_SET, DEMO_EXAM_SETS } from "@/features/exam/mock-data";
import type {
  ExamAnswerMap,
  ExamFlagMap,
  ExamQuestion,
  ExamSet,
  PersistedExamSession,
} from "@/features/exam/types";
import { calculateExamResult, formatExamTime } from "@/features/exam/utils";

const STORAGE_VERSION = 1;

type LiveExamResponse = {
  ok: boolean;
  examSets?: ExamSet[];
  error?: string;
};

function createDefaultSession(examSet: ExamSet): PersistedExamSession {
  return {
    version: STORAGE_VERSION,
    stage: "intro",
    currentIndex: 0,
    startedAt: null,
    expiresAt: null,
    remainingSeconds: examSet.durationMinutes * 60,
    answers: {},
    flags: {},
    result: null,
    submittedAt: null,
  };
}

function getStorageKey(candidateId: string, examSetId: string) {
  return `aviation-exam-session:${candidateId}:${examSetId}`;
}

function getSelectedOptionIds(
  question: ExamQuestion,
  answers: ExamAnswerMap,
) {
  return answers[question.id] ?? [];
}

export function ExamWorkbench({
  candidateId,
  studentName,
}: {
  candidateId: string;
  studentName: string;
}) {
  const [examSets, setExamSets] = useState<ExamSet[]>(DEMO_EXAM_SETS);
  const [selectedExamSetId, setSelectedExamSetId] = useState<string>(DEMO_EXAM_SET.id);
  const [contentSource, setContentSource] = useState<"demo" | "live">("demo");
  const [contentLoading, setContentLoading] = useState(true);
  const [showDetailedReview, setShowDetailedReview] = useState(false);
  const [session, setSession] = useState<PersistedExamSession>(() =>
    createDefaultSession(DEMO_EXAM_SET),
  );
  const [hydrated, setHydrated] = useState(false);
  const examSet =
    examSets.find((item) => item.id === selectedExamSetId) ?? examSets[0] ?? DEMO_EXAM_SET;

  const storageKey = useMemo(
    () => getStorageKey(candidateId, examSet.id),
    [candidateId, examSet.id],
  );
  const currentQuestion = examSet.questions[session.currentIndex];
  const answeredCount = Object.values(session.answers).filter(
    (selected) => selected.length > 0,
  ).length;
  const flaggedCount = Object.values(session.flags).filter(Boolean).length;
  const questionPageIndex = Math.floor(session.currentIndex / 5);
  const totalQuestionPages = Math.max(1, Math.ceil(examSet.questions.length / 5));
  const visibleQuestions = examSet.questions.slice(
    questionPageIndex * 5,
    questionPageIndex * 5 + 5,
  );

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    const initDataRaw = webApp?.initData?.trim();

    if (!initDataRaw) {
      setContentSource("demo");
      setExamSets(DEMO_EXAM_SETS);
      setSelectedExamSetId(DEMO_EXAM_SET.id);
      setContentLoading(false);
      return;
    }

    void fetch("/api/exams/session-content", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ initDataRaw }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as LiveExamResponse;

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error ?? "Unable to load exam content.");
        }

        if (payload.examSets?.length) {
          setExamSets(payload.examSets);
          setSelectedExamSetId(payload.examSets[0]?.id ?? DEMO_EXAM_SET.id);
          setContentSource("live");
        } else {
          setExamSets(DEMO_EXAM_SETS);
          setSelectedExamSetId(DEMO_EXAM_SET.id);
          setContentSource("demo");
        }
      })
      .catch(() => {
        setExamSets(DEMO_EXAM_SETS);
        setSelectedExamSetId(DEMO_EXAM_SET.id);
        setContentSource("demo");
      })
      .finally(() => {
        setContentLoading(false);
      });
  }, []);

  useEffect(() => {
    setSession(createDefaultSession(examSet));
    setHydrated(false);
  }, [examSet]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);

      if (saved) {
        const parsed = JSON.parse(saved) as PersistedExamSession;

        if (parsed.version === STORAGE_VERSION) {
          if (parsed.stage === "active" && parsed.expiresAt) {
            const recalculatedRemaining = Math.max(
              0,
              Math.floor((parsed.expiresAt - Date.now()) / 1000),
            );

            if (recalculatedRemaining === 0) {
              const nextSession: PersistedExamSession = {
                ...parsed,
                stage: "submitted",
                remainingSeconds: 0,
                submittedAt: parsed.submittedAt ?? Date.now(),
                result: calculateExamResult(examSet.questions, parsed.answers),
              };
              setSession(nextSession);
              // If it wasn't submitted before, it will be marked submitted now.
              // We can't reliably submit inside this effect safely without 
              // tracking if we already submitted, so we just update local state.
            } else {
              setSession({
                ...parsed,
                remainingSeconds: recalculatedRemaining,
              });
            }
          } else {
            setSession(parsed);
          }
        }
      } else {
        setSession(createDefaultSession(examSet));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
      setSession(createDefaultSession(examSet));
    } finally {
      setHydrated(true);
    }
  }, [examSet, storageKey]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(session));
  }, [hydrated, session, storageKey]);

  useEffect(() => {
    if (session.stage !== "active") {
      return;
    }

    const timer = window.setInterval(() => {
      setSession((current) => {
        if (current.stage !== "active") {
          return current;
        }

        const nextRemaining = Math.max(0, current.remainingSeconds - 1);

        if (nextRemaining === 0) {
          const nextSession: PersistedExamSession = {
            ...current,
            stage: "submitted",
            remainingSeconds: 0,
            submittedAt: Date.now(),
            result: calculateExamResult(examSet.questions, current.answers),
          };
          void submitToServer(nextSession);
          return nextSession;
        }

        return {
          ...current,
          remainingSeconds: nextRemaining,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [examSet.questions, session.stage]);

  function startExam() {
    const now = Date.now();
    setShowDetailedReview(false);

    setSession({
      ...createDefaultSession(examSet),
      stage: "active",
      startedAt: now,
      expiresAt: now + examSet.durationMinutes * 60 * 1000,
      remainingSeconds: examSet.durationMinutes * 60,
    });
  }

  function resetExam() {
    const next = createDefaultSession(examSet);
    setShowDetailedReview(false);
    setSession(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function moveToQuestion(index: number) {
    setSession((current) => ({
      ...current,
      currentIndex: index,
    }));
  }

  function toggleFlag(questionId: string) {
    setSession((current) => ({
      ...current,
      flags: {
        ...current.flags,
        [questionId]: !current.flags[questionId],
      } satisfies ExamFlagMap,
    }));
  }

  function updateAnswer(question: ExamQuestion, optionId: string) {
    setSession((current) => {
      const existing = current.answers[question.id] ?? [];
      let nextSelected: string[];

      if (question.type === "multiple_choice") {
        nextSelected = existing.includes(optionId)
          ? existing.filter((value) => value !== optionId)
          : [...existing, optionId];
      } else {
        nextSelected = [optionId];
      }

      return {
        ...current,
        answers: {
          ...current.answers,
          [question.id]: nextSelected,
        } satisfies ExamAnswerMap,
      };
    });
  }

  async function submitToServer(finalSession: PersistedExamSession) {
    const webApp = window.Telegram?.WebApp;
    const initDataRaw = webApp?.initData?.trim();

    if (!initDataRaw || contentSource !== "live") {
      return;
    }

    try {
      await fetch("/api/exams/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          initDataRaw,
          examSet,
          session: finalSession,
        }),
      });
    } catch (e) {
      console.error("Failed to submit exam attempt", e);
    }
  }

  function submitExam() {
    setShowDetailedReview(false);
    setSession((current) => {
      const nextSession: PersistedExamSession = {
        ...current,
        stage: "submitted",
        submittedAt: Date.now(),
        result: calculateExamResult(examSet.questions, current.answers),
      };
      void submitToServer(nextSession);
      return nextSession;
    });
  }

  const selectedOptionIds = currentQuestion
    ? getSelectedOptionIds(currentQuestion, session.answers)
    : [];

  return (
    <section className="exam-panel">
      <div className="exam-panel__header">
        <div className="exam-panel__heading">
          <h2>{examSet.title}</h2>
          <p className="exam-panel__lede">{studentName}</p>
        </div>
        <div className="exam-status-strip">
          <div>
            <span>Source</span>
            <strong>{examSet.modeLabel}</strong>
          </div>
          <div>
            <span>Progress</span>
            <strong>
              {answeredCount}/{examSet.questions.length}
            </strong>
          </div>
          <div>
            <span>Time</span>
            <strong>{formatExamTime(session.remainingSeconds)}</strong>
          </div>
        </div>
      </div>

      {session.stage === "intro" && (
        <div className="exam-intro-grid exam-intro-grid--single">
          <section className="exam-intro-card">
            <span className="exam-chip">
              {contentSource === "live" ? "Live Exams" : "Practice Subjects"}
            </span>
            <h3>{studentName}, choose a subject first</h3>
            <p>
              {contentSource === "live"
                ? "Your department subjects are ready. Pick the exam you want to take, then start when you are ready."
                : "Live subject papers are not available yet, so practice subjects are ready for now."}
            </p>
            <div className="exam-subject-grid">
              {examSets.map((item) => {
                const isSelected = item.id === examSet.id;

                return (
                  <button
                    key={item.id}
                    className={[
                      "exam-subject-card",
                      isSelected ? "exam-subject-card--selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedExamSetId(item.id)}
                    type="button"
                  >
                    <span className="exam-chip exam-chip--soft">{item.subject}</span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.questions.length} questions • {item.durationMinutes} min
                    </small>
                  </button>
                );
              })}
            </div>
            <ul className="exam-rule-list">
              {examSet.instructions.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <div className="exam-action-row">
              <button className="primary-button exam-action-row__button" onClick={startExam} type="button">
                Start exam
              </button>
            </div>
          </section>
        </div>
      )}

      {session.stage === "active" && currentQuestion && (
        <div className="exam-session-grid exam-session-grid--single">
          <aside className="exam-sidebar exam-sidebar--top">
            <div className="exam-sidebar__card">
              <span className="exam-chip exam-chip--soft">Questions</span>
              <div className="exam-metrics">
                <div>
                  <span>Answered</span>
                  <strong>{answeredCount}</strong>
                </div>
                <div>
                  <span>Flagged</span>
                  <strong>{flaggedCount}</strong>
                </div>
                <div>
                  <span>Current</span>
                  <strong>
                    {session.currentIndex + 1}/{examSet.questions.length}
                  </strong>
                </div>
              </div>
              <div className="question-palette">
                {visibleQuestions.map((question) => {
                  const index = examSet.questions.findIndex((item) => item.id === question.id);
                  const hasAnswer = (session.answers[question.id] ?? []).length > 0;
                  const isFlagged = Boolean(session.flags[question.id]);
                  const isCurrent = index === session.currentIndex;

                  return (
                    <button
                      key={question.id}
                      className={[
                        "question-palette__item",
                        hasAnswer ? "question-palette__item--answered" : "",
                        isFlagged ? "question-palette__item--flagged" : "",
                        isCurrent ? "question-palette__item--current" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => moveToQuestion(index)}
                      type="button"
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="exam-palette-footer">
                <button
                  className="secondary-button secondary-button--compact"
                  disabled={questionPageIndex === 0}
                  onClick={() => moveToQuestion(Math.max(0, session.currentIndex - 5))}
                  type="button"
                >
                  Prev 5
                </button>
                <span>
                  {questionPageIndex + 1}/{totalQuestionPages}
                </span>
                <button
                  className="secondary-button secondary-button--compact"
                  disabled={questionPageIndex === totalQuestionPages - 1}
                  onClick={() =>
                    moveToQuestion(
                      Math.min(examSet.questions.length - 1, session.currentIndex + 5),
                    )
                  }
                  type="button"
                >
                  Next 5
                </button>
              </div>
            </div>
          </aside>

          <section className="exam-question-card">
            <div className="exam-question-card__top">
              <div>
                <span className="exam-chip">{currentQuestion.topic}</span>
                <h3>
                  Question {session.currentIndex + 1}
                </h3>
              </div>
              <button
                className={[
                  "secondary-button secondary-button--compact exam-flag-button",
                  session.flags[currentQuestion.id] ? "secondary-button--active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => toggleFlag(currentQuestion.id)}
                type="button"
              >
                {session.flags[currentQuestion.id] ? "Flagged" : "Flag"}
              </button>
            </div>

            <p className="exam-question-prompt">{currentQuestion.prompt}</p>

            {currentQuestion.imageUrl && (
              <div className="exam-image-frame">
                <img
                  alt={`Illustration for question ${session.currentIndex + 1}`}
                  className="exam-image"
                  src={currentQuestion.imageUrl}
                />
              </div>
            )}

            <div className="exam-options">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptionIds.includes(option.id);

                return (
                  <button
                    key={option.id}
                    className={[
                      "exam-option",
                      isSelected ? "exam-option--selected" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => updateAnswer(currentQuestion, option.id)}
                    type="button"
                  >
                    <span className="exam-option__marker">{option.label}</span>
                    <span>{option.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="exam-navigation-row">
              <button
                className="secondary-button"
                disabled={session.currentIndex === 0}
                onClick={() => moveToQuestion(Math.max(0, session.currentIndex - 1))}
                type="button"
              >
                Previous
              </button>
              <button
                className="secondary-button"
                disabled={session.currentIndex === examSet.questions.length - 1}
                onClick={() =>
                  moveToQuestion(
                    Math.min(examSet.questions.length - 1, session.currentIndex + 1),
                  )
                }
                type="button"
              >
                Next
              </button>
            </div>

            <div className="exam-submit-row">
              <button className="primary-button exam-submit-button" onClick={submitExam} type="button">
                Submit exam
              </button>
            </div>
          </section>
        </div>
      )}

      {session.stage === "submitted" && session.result && (
        <div className="exam-results-grid">
          <section className="exam-results-card">
            <span className="exam-chip exam-chip--accent">Result</span>
            <h3>Your practice exam summary</h3>
            <div className="exam-results-metrics">
              <article>
                <span>Correct</span>
                <strong>{session.result.correctCount}</strong>
              </article>
              <article>
                <span>Incorrect</span>
                <strong>{session.result.incorrectCount}</strong>
              </article>
              <article>
                <span>Unanswered</span>
                <strong>{session.result.unansweredCount}</strong>
              </article>
              <article>
                <span>Flagged</span>
                <strong>{flaggedCount}</strong>
              </article>
            </div>
            <div className="exam-action-row">
              <button className="primary-button exam-action-row__button" onClick={startExam} type="button">
                Retake practice exam
              </button>
              <button className="secondary-button exam-action-row__button" onClick={resetExam} type="button">
                Reset session
              </button>
            </div>
          </section>

          <section className="exam-review-card">
            <div className="exam-review-card__top">
              <div>
                <span className="exam-chip exam-chip--soft">Review</span>
                <h3>Question-by-question feedback</h3>
              </div>
              <button
                className="secondary-button secondary-button--compact exam-review-toggle"
                onClick={() => setShowDetailedReview((current) => !current)}
                type="button"
              >
                {showDetailedReview ? "Hide review" : "Show review"}
              </button>
            </div>

            {!showDetailedReview ? (
              <p className="exam-review-card__hint">
                Open the detailed review only when you want to check each answer and explanation.
              </p>
            ) : (
              <div className="exam-review-list">
                {examSet.questions.map((question, index) => {
                  const selected = session.answers[question.id] ?? [];
                  const result = calculateExamResult([question], {
                    [question.id]: selected,
                  });
                  const isCorrect = result.correctCount === 1;

                  return (
                    <article
                      key={question.id}
                      className={[
                        "exam-review-item",
                        isCorrect
                          ? "exam-review-item--correct"
                          : selected.length === 0
                            ? "exam-review-item--unanswered"
                            : "exam-review-item--incorrect",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <div className="exam-review-item__header">
                        <strong>Q{index + 1}</strong>
                        <span>{question.topic}</span>
                      </div>
                      <p>{question.prompt}</p>
                      <small>{question.explanation}</small>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
