const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectDir = process.cwd();
const sourcePath = path.join(projectDir, 'cabin-exam-3.json');
const outputPath = path.join(projectDir, 'pilot-exam3-import.json');
const adminTelegramId = process.env.TELEGRAM_ADMIN_CHAT_ID || '5827966050';

if (!fs.existsSync(sourcePath)) {
  console.error(`Source file not found: ${sourcePath}`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

payload.questionBank = {
  key: 'pilot-bank-exam-3',
  slug: 'pilot-bank-exam-3',
  title: 'Pilot Exam 3 Bank',
  description: 'Imported from PDF exam 3 for pilot training',
  departmentCode: 'PILOT',
  topicSlug: 'aptitude',
};

payload.examSet = {
  key: 'pilot-training-exam-3',
  slug: 'pilot-training-exam-3',
  title: 'Pilot Training Exam Mode Exam 3',
  description: 'Imported from PDF exam 3',
  departmentCode: 'PILOT',
  topicSlug: 'aptitude',
  mode: 'mock',
  durationMinutes: 60,
  published: true,
};

payload.questions = payload.questions.map((question, index) => ({
  ...question,
  key: `pilot-exam3-q${String(index + 1).padStart(3, '0')}`,
  topicSlug: 'aptitude',
  type: question.options.length <= 2 ? 'true_false' : 'single_choice',
}));

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${outputPath}`);

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
execFileSync(npmCommand, ['run', 'import-content', './pilot-exam3-import.json', adminTelegramId], {
  cwd: projectDir,
  stdio: 'inherit',
});
