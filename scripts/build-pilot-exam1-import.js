const fs = require('fs');
const path = require('path');

const projectDir = 'c:\\Users\\User\\OneDrive\\Desktop\\New folder\\aviation-exam-app';
const inputPath = path.join(projectDir, 'exam_1_raw.txt');
const outputPath = path.join(projectDir, 'pilot-exam1-import.json');
const text = fs.readFileSync(inputPath, 'utf8');
const lines = text.replace(/\r/g, '').split('\n');
const rawQuestions = [];
let current = null;
let section = 'prompt';

function finalizeCurrent() {
  if (!current) return;
  if (current.options.length >= 2) {
    rawQuestions.push(current);
  }
  current = null;
  section = 'prompt';
}

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  if (/^\d+\. /.test(trimmed)) {
    finalizeCurrent();
    current = {
      number: parseInt(trimmed.match(/^(\d+)\./)[1], 10),
      prompt: trimmed,
      options: [],
      answerLabel: null,
      answerText: '',
      explanation: '',
    };
    section = 'prompt';
    continue;
  }

  if (!current) continue;

  if (/^Answer/i.test(trimmed)) {
    section = 'answer';
    continue;
  }

  if (/^Explanation/i.test(trimmed)) {
    section = 'explanation';
    continue;
  }

  if (section === 'prompt') {
    const optionMatch = trimmed.match(/^([A-D])\.\s*(.+)$/);
    if (optionMatch) {
      current.options.push({ key: optionMatch[1], text: optionMatch[2].trim() });
      continue;
    }
    current.prompt += ` ${trimmed}`;
    continue;
  }

  if (section === 'answer') {
    const answerMatch = trimmed.match(/^([A-D])\.\s*(.+)$/);
    if (answerMatch) {
      current.answerLabel = answerMatch[1];
      current.answerText = answerMatch[2].trim();
      section = 'explanation';
    } else {
      current.answerText += ` ${trimmed}`;
    }
    continue;
  }

  if (section === 'explanation') {
    current.explanation += (current.explanation ? ' ' : '') + trimmed;
  }
}

finalizeCurrent();

const questions = [];
for (const q of rawQuestions) {
  const promptLine = q.prompt.replace(/^\d+\.\s*/, '').trim();
  const options = q.options.map((opt) => ({
    key: opt.key,
    text: opt.text,
    isCorrect: opt.key === q.answerLabel,
  }));

  if (!options.length) continue;

  questions.push({
    key: `pilot-ex1-pdf-${String(q.number).padStart(3, '0')}`,
    topicSlug: 'aptitude',
    type: 'single_choice',
    prompt: promptLine,
    explanation: q.explanation || `Imported from Pilot Exam 1 PDF. ${q.answerText || ''}`.trim(),
    points: 1,
    difficultyLevel: 1,
    sourceLabel: 'Pilot Exam 1 PDF',
    sourceYear: 2026,
    options,
  });
}

const payload = {
  questionBank: {
    key: 'pilot-bank-exam-1',
    slug: 'pilot-bank-exam-1',
    title: 'Pilot Exam 1 Bank',
    description: 'Imported Pilot Exam 1 questions from PDF',
    departmentCode: 'PILOT',
    topicSlug: 'aptitude',
  },
  examSet: {
    key: 'pilot-exam-set-1',
    slug: 'pilot-exam-set-1',
    title: 'Pilot Training Exam 1',
    description: 'Pilot Training Exam 1 questions from PDF',
    departmentCode: 'PILOT',
    topicSlug: 'aptitude',
    mode: 'mock',
    durationMinutes: 60,
    published: true,
  },
  questions,
};

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${payload.questions.length} questions to ${path.basename(outputPath)}`);