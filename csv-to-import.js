const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");

const csvPath = process.argv[2] || "questions.csv";
const departmentCode = process.argv[3] || "AMT";

const rows = csv.parse(fs.readFileSync(csvPath, "utf-8"), { columns: true });

const durationMinutes = Number(rows[0].duration_minutes) || 60;

const dept = departmentCode.toLowerCase().replace(/[^a-z0-9]/g, "-");
const prefix = dept;

const questions = rows.map((r) => ({
  key: `q-${r.question_num || r['-question_num'] || r['#']}`,
  topicSlug: r.topicSlug || r.Topic || r.topic || undefined,
  type: r.type || "single_choice",
  instruction: r.instruction || r.instruction_text || r.instructions || r.direction || undefined,
  passage: r.passage || r.passage_text || undefined,
  prompt: r.prompt || r.question,
  explanation: r.explanation || undefined,
  imageStoragePath: r.image || undefined,
  options: [
    { key: "A", text: r.optA || r.opt_a || r.a, isCorrect: (r.correct?.toUpperCase() === "A") },
    { key: "B", text: r.optB || r.opt_b || r.b, isCorrect: (r.correct?.toUpperCase() === "B") },
    { key: "C", text: r.optC || r.opt_c || r.c, isCorrect: (r.correct?.toUpperCase() === "C") },
    { key: "D", text: r.optD || r.opt_d || r.d, isCorrect: (r.correct?.toUpperCase() === "D") },
    { key: "E", text: r.optE || r.opt_e || r.e, isCorrect: (r.correct?.toUpperCase() === "E") },
  ].filter((o) => o.text),
}));

const payload = {
  questionBank: {
    key: `${prefix}-bank-v1`,
    slug: `${prefix}-general-bank-v1`,
    title: `${departmentCode} Question Bank`,
    departmentCode,
  },
  examSet: {
    key: `${prefix}-practice-2026`,
    slug: `${prefix}-practice-2026`,
    title: `${departmentCode} Practice`,
    departmentCode,
    mode: "practice",
    durationMinutes,
    published: true,
  },
  questions,
};

const outPath = path.resolve("import-payload.json");
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${questions.length} questions to ${outPath}`);
