export const APP_COPY = {
  kicker: "Telegram Mini App",
  title: "EAU Entrance Prep",
  description:
    "A bilingual exam preparation platform for Ethiopian Aviation University candidates, built for polished mobile study and mock entrance exams inside Telegram.",
} as const;

export const DEPARTMENTS = [
  {
    slug: "amt-maintenance",
    shortLabel: "AMT",
    label: "AMT Maintenance",
    description:
      "Mechanical reasoning, technical aptitude, maintenance basics, and image-supported practice questions.",
  },
  {
    slug: "cabin-crew",
    shortLabel: "Cabin",
    label: "Cabin Crew",
    description:
      "Communication, service scenarios, reasoning, and entrance-oriented practice exams.",
  },
  {
    slug: "marketing",
    shortLabel: "Market",
    label: "Marketing",
    description:
      "Business basics, quantitative reasoning, communication, and exam-focused drills.",
  },
  {
    slug: "pilot",
    shortLabel: "Pilot",
    label: "Pilot",
    description:
      "Aptitude, spatial reasoning, math, and aviation-oriented entrance exam preparation.",
  },
  {
    slug: "others",
    shortLabel: "Others",
    label: "Others",
    description:
      "General entrance preparation for other aviation university departments.",
  },
] as const;
