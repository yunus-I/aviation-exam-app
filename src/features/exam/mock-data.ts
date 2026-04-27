import type { ExamSet } from "@/features/exam/types";

function svgDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const mechanicalDiagram = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 220">
  <rect width="420" height="220" rx="28" fill="#f7f1e6"/>
  <circle cx="116" cy="112" r="52" fill="#d8e7df" stroke="#0f766e" stroke-width="6"/>
  <circle cx="116" cy="112" r="18" fill="#fffaf1" stroke="#0f766e" stroke-width="4"/>
  <circle cx="238" cy="112" r="34" fill="#f3d9b8" stroke="#c97b28" stroke-width="6"/>
  <circle cx="238" cy="112" r="12" fill="#fffaf1" stroke="#c97b28" stroke-width="4"/>
  <path d="M168 112h30" stroke="#1c1a17" stroke-width="6" stroke-linecap="round"/>
  <path d="M288 84l52-30" stroke="#1c1a17" stroke-width="6" stroke-linecap="round"/>
  <path d="M288 140l52 30" stroke="#1c1a17" stroke-width="6" stroke-linecap="round"/>
  <text x="30" y="36" font-size="20" font-family="Georgia" fill="#134e4a">Gear A</text>
  <text x="214" y="36" font-size="20" font-family="Georgia" fill="#9a6700">Gear B</text>
</svg>
`);

const aircraftAttitudeDiagram = svgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 220">
  <rect width="420" height="220" rx="28" fill="#f7f1e6"/>
  <path d="M0 0h420v104H0z" fill="#b9d7df"/>
  <path d="M0 104h420v116H0z" fill="#d69f63"/>
  <path d="M0 116L420 92" stroke="#fffaf1" stroke-width="8"/>
  <circle cx="210" cy="110" r="66" fill="none" stroke="#1c1a17" stroke-width="7"/>
  <path d="M150 110h120" stroke="#fffaf1" stroke-width="5"/>
  <path d="M210 70v80" stroke="#fffaf1" stroke-width="5"/>
  <path d="M168 110h84" stroke="#1c1a17" stroke-width="8" stroke-linecap="round"/>
  <path d="M210 96l-18 14h36z" fill="#1c1a17"/>
</svg>
`);

export const DEMO_EXAM_SET: ExamSet = {
  id: "pilot-mock-001",
  title: "Entrance Mock Session",
  department: "Aviation Entrance",
  durationMinutes: 18,
  modeLabel: "Mock Exam",
  instructions: [
    "Answer every question before time runs out.",
    "Use the palette to move quickly between questions.",
    "Flag uncertain questions and review them before submitting.",
    "Your progress is autosaved on this device.",
  ],
  questions: [
    {
      id: "q1",
      type: "single_choice",
      topic: "Mechanical Reasoning",
      prompt:
        "Look at the two connected gears. If Gear A rotates clockwise, which direction will Gear B rotate?",
      explanation:
        "Two directly connected gears rotate in opposite directions.",
      points: 1,
      imageUrl: mechanicalDiagram,
      options: [
        { id: "q1a", label: "A", text: "Clockwise", isCorrect: false },
        { id: "q1b", label: "B", text: "Counterclockwise", isCorrect: true },
        { id: "q1c", label: "C", text: "It will not move", isCorrect: false },
        { id: "q1d", label: "D", text: "Direction cannot be known", isCorrect: false },
      ],
    },
    {
      id: "q2",
      type: "single_choice",
      topic: "Mathematics",
      prompt:
        "A trainee solves 18 questions in 12 minutes at a steady speed. At the same rate, how many questions can be solved in 30 minutes?",
      explanation:
        "The rate is 1.5 questions per minute, so in 30 minutes the result is 45 questions.",
      points: 1,
      options: [
        { id: "q2a", label: "A", text: "36", isCorrect: false },
        { id: "q2b", label: "B", text: "40", isCorrect: false },
        { id: "q2c", label: "C", text: "45", isCorrect: true },
        { id: "q2d", label: "D", text: "54", isCorrect: false },
      ],
    },
    {
      id: "q3",
      type: "multiple_choice",
      topic: "Reasoning",
      prompt:
        "Select all statements that show strong exam strategy for a timed entrance test.",
      explanation:
        "Good strategy includes managing time, flagging uncertain questions, and returning later instead of getting stuck.",
      points: 2,
      options: [
        { id: "q3a", label: "A", text: "Skip one very hard question and come back later", isCorrect: true },
        { id: "q3b", label: "B", text: "Spend half of the total exam time on the first question", isCorrect: false },
        { id: "q3c", label: "C", text: "Use the question flag feature for review", isCorrect: true },
        { id: "q3d", label: "D", text: "Track the timer while keeping a steady pace", isCorrect: true },
      ],
    },
    {
      id: "q4",
      type: "single_choice",
      topic: "Pilot Aptitude",
      prompt:
        "In the attitude indicator image, which side of the horizon line is slightly higher, showing a left bank correction is needed?",
      explanation:
        "The horizon line slopes upward to the right, indicating the aircraft is banked left.",
      points: 1,
      imageUrl: aircraftAttitudeDiagram,
      options: [
        { id: "q4a", label: "A", text: "The left side is higher", isCorrect: false },
        { id: "q4b", label: "B", text: "The right side is higher", isCorrect: true },
        { id: "q4c", label: "C", text: "Both sides are level", isCorrect: false },
        { id: "q4d", label: "D", text: "No horizon line is shown", isCorrect: false },
      ],
    },
    {
      id: "q5",
      type: "true_false",
      topic: "English",
      prompt:
        "True or False: Clear communication is essential in both cockpit and cabin operations.",
      explanation:
        "This is true because aviation safety depends on accurate and timely communication.",
      points: 1,
      options: [
        { id: "q5a", label: "A", text: "True", isCorrect: true },
        { id: "q5b", label: "B", text: "False", isCorrect: false },
      ],
    },
  ],
};
