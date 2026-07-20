const fs = require('fs');

const text = `1. Choose the antonym of Soporific:
A) Sleepy
B) Drowsy
C) Stimulating
D) Calming
Answer: C) Stimulating
Explanation: A soporific substance tends to induce drowsiness or sleep, whereas something stimulating keeps you awake.

2. Choose the synonym of Taciturn:
A) Talkative
B) Reserved
C) Loquacious
D) Garrulous
Answer: B) Reserved
Explanation: Taciturn describes a person who is reserved or uncommunicative in speech, saying very little.

3. Choose the antonym of Transient:
A) Temporary
B) Fleeting
C) Perpetual
D) Brief
Answer: C) Perpetual
Explanation: Transient means lasting only for a short time, while perpetual means never-ending or everlasting.

4. Choose the synonym of Vacillate:
A) Decide
B) Waver
C) Persist
D) Remain
Answer: B) Waver
Explanation: Vacillate means to alternate or waver between different opinions or actions (waver).

5. Choose the antonym of Reproach:
A) Blame
B) Criticize
C) Commend
D) Scold
Answer: C) Commend
Explanation: To reproach means to express disapproval or disappointment, while commend means to praise.

6. Choose the synonym of Zealous:
A) Indifferent
B) Apathetic
C) Enthusiastic
D) Uninterested
Answer: C) Enthusiastic
Explanation: Zealous means having or showing great energy and enthusiasm for a cause (enthusiastic).

7. Choose the synonym of Obdurate:
A) Yielding
B) Obstinate
C) Flexible
D) Amenable
Answer: B) Obstinate
Explanation: Both obdurate and obstinate describe someone who is stubbornly unyielding.

8. Choose the antonym of Meticulous:
A) Careful
B) Negligent
C) Precise
D) Detailed
Answer: B) Negligent
Explanation: Meticulous means taking extreme care and attention to detail, while negligent means careless or failing to take proper care.

9. Choose the synonym of Ephemeral:
A) Permanent
B) Transient
C) Eternal
D) Lasting
Answer: B) Transient
Explanation: Both words mean short-lived, fleeting, or passing quickly out of existence.

10. Choose the antonym of Placate:
A) Enrage
B) Appease
C) Pacify
D) Soothe
Answer: A) Enrage
Explanation: Placate means to make someone less angry or hostile, while enrage means to make them furious.

11. Choose the synonym of Acquiesce:
A) Deny
B) Refuse
C) Consent
D) Protest
Answer: C) Consent
Explanation: Acquiesce means to accept something reluctantly but without protest (consent).

12. Choose the antonym of Fortuitous:
A) Accidental
B) Intentional
C) Random
D) Lucky
Answer: B) Intentional
Explanation: Fortuitous means happening by accident or lucky chance, while intentional means planned or deliberate.

13. Choose the synonym of Audacious:
A) Timid
B) Daring
C) Cautious
D) Fearful
Answer: B) Daring
Explanation: Audacious means showing a willingness to take surprisingly bold risks (daring).

14. Choose the antonym of Morose:
A) Sullen
B) Cheerful
C) Gloomy
D) Glum
Answer: B) Cheerful
Explanation: Morose means sullen, gloomy, and ill-tempered, making cheerful its direct antonym.

15. Choose the synonym of Perspicacious:
A) Ignorant
B) Insightful
C) Dull
D) Foolish
Answer: B) Insightful
Explanation: Perspicacious means having a ready insight into and understanding of things (insightful).

16. Choose the antonym of Cogent:
A) Convincing
B) Ineffective
C) Logical
D) Persuasive
Answer: B) Ineffective
Explanation: A cogent argument is clear and highly persuasive; an ineffective argument fails to convince.

17. Choose the synonym of Frugal:
A) Wasteful
B) Extravagant
C) Thrifty
D) Prodigal
Answer: C) Thrifty
Explanation: Frugal means sparing or economical with regard to money or food (thrifty).

18. Choose the synonym of Capricious:
A) Consistent
B) Fickle
C) Predictable
D) Constant
Answer: B) Fickle
Explanation: Both words describe someone or something that changes mind, mood, or direction unpredictably.

19. The cybersecurity analyst recommended that the IT team install the critical software updates _______ in order to prevent malicious actors from _______ the vulnerability.
A) rapidly / ignoring
B) systematically / exploiting
C) randomly / creating
D) occasionally / fixing
Answer: B) systematically / exploiting
Explanation: Applying patches systematically (ordered, thorough method) stops attackers from exploiting vulnerabilities.

20. Due to the unexpected delay in receiving the laboratory results, the medical board decided to _______ the final diagnosis until a _______ report could be generated.
A) accelerate / partial
B) postpone / comprehensive
C) cancel / brief
D) publish / preliminary
Answer: B) postpone / comprehensive
Explanation: You postpone (delay) medical decisions when waiting for a comprehensive (complete, all-inclusive) report.

21. Although the structural design of the new pavilion was visually _______, the materials required for its construction were deemed too _______ for the local municipality's budget.
A) simple / cheap
B) elegant / expensive
C) flawed / costless
D) massive / affordable
Answer: B) elegant / expensive
Explanation: Use of the word "Although" sets up a contrast: the pavilion was elegantly designed but too expensive, causing a conflict with the budget.

22. The standard operating procedure requires all employee personnel to _______ their credentials before _______ access to the secure server room.
A) lose / requesting
B) verify / obtaining
C) forget / denying
D) change / blocking
Answer: B) verify / obtaining
Explanation: Standard IT security process: personnel must verify who they are before obtaining physical or digital entry.

23. The torrential rainfall heavily _______ the afternoon commute, forcing city transit officials to suggest _______ routes for commuters traveling downtown.
A) assisted / standard
B) disrupted / alternative
C) stopped / longer
D) improved / normal
Answer: B) disrupted / alternative
Explanation: Severe weather disrupted the normal flow of traffic, forcing transit authorities to suggest alternative routes.

24. Because the corporate project budget remains highly _______ at this stage, the procurement manager is hesitant to purchase any _______ machinery.
A) generous / cheap
B) tentative / permanent
C) finalized / expensive
D) massive / temporary
Answer: B) tentative / permanent
Explanation: Budgets that are not fixed are tentative (subject to change), which makes a manager avoid permanent or unchangeable financial commitments.

25. The human resources department plans to _______ the seasonal workforce next month to effectively _______ the increased consumer demand during the holidays.
A) reduce / avoid
B) augment / manage
C) dismiss / decrease
D) stabilize / ignore
Answer: B) augment / manage
Explanation: Corporate logic dictates you augment (increase/add to) staff to manage higher holiday traffic volumes.`;

// clean text to avoid matching section headers as lines
const cleanedText = text.replace(/Grammar Application & Sentence Completion/gi, '');
const blocks = cleanedText.split(/\n\n+/);
const questions = [];

blocks.forEach((block, index) => {
  const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 5) return; 

  const promptMatch = lines[0].match(/^\d+\.\s*(.+)/);
  if (!promptMatch) return;
  const prompt = promptMatch[1];

  let optionA = "", optionB = "", optionC = "", optionD = "";
  
  for (const line of lines) {
    if (line.startsWith("A)")) optionA = line.replace(/^A\)\s*/, '');
    else if (line.startsWith("B)")) optionB = line.replace(/^B\)\s*/, '');
    else if (line.startsWith("C)")) optionC = line.replace(/^C\)\s*/, '');
    else if (line.startsWith("D)")) optionD = line.replace(/^D\)\s*/, '');
  }

  const answerLine = lines.find(l => l.startsWith('Answer:'));
  if (!answerLine) return;
  
  const answerMatch = answerLine.match(/^Answer:\s*([A-D])(?:\)|)\s*(?:\|\s*Explanation:)?\s*(.*)/i);
  let correctLetter = "A", explanation = "No explanation.";
  
  if (answerMatch) {
    correctLetter = answerMatch[1];
  }

  const expLine = lines.find(l => l.startsWith('Explanation:'));
  if (expLine) {
    explanation = expLine.replace(/^Explanation:\s*/, '');
  }

  questions.push({
    key: `cabin-practice-3-q${index + 1}`,
    topicSlug: "english",
    type: "multiple_choice",
    prompt: prompt,
    explanation: explanation,
    options: [
      { key: "A", text: optionA, isCorrect: correctLetter === "A" },
      { key: "B", text: optionB, isCorrect: correctLetter === "B" },
      { key: "C", text: optionC, isCorrect: correctLetter === "C" },
      { key: "D", text: optionD, isCorrect: correctLetter === "D" }
    ]
  });
});

const payload = {
  questionBank: {
    key: "cabin-practice-bank-3",
    slug: "cabin-practice-3",
    title: "Cabin Crew Practice 3 Bank",
    description: "Vocabulary, Synonyms & Antonyms",
    departmentCode: "CABIN"
  },
  examSet: {
    key: "cabin-practice-set-3",
    slug: "cabin-practice-3",
    title: "Practice 3",
    description: "Cabin Crew Practice Test 3",
    departmentCode: "CABIN",
    mode: "practice",
    durationMinutes: 60,
    published: true
  },
  questions: questions
};

fs.writeFileSync('cabin-practice-3.json', JSON.stringify(payload, null, 2));
console.log('Wrote cabin-practice-3.json with', questions.length, 'questions.');
