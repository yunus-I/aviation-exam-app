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
  key: `q-${r.question_num}`,
  topicSlug: r.topicSlug || undefined,
  type: r.type,
  prompt: r.prompt,
  explanation: r.explanation || undefined,
  imageStoragePath: r.image || undefined,
  options: [
    { key: "A", text: r.optA, isCorrect: r.correct?.toUpperCase() === "A" },
    { key: "B", text: r.optB, isCorrect: r.correct?.toUpperCase() === "B" },
    { key: "C", text: r.optC, isCorrect: r.correct?.toUpperCase() === "C" },
    { key: "D", text: r.optD, isCorrect: r.correct?.toUpperCase() === "D" },
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
