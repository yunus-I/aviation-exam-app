const fs = require('fs');

const text = fs.readFileSync('exam_1_raw.txt', 'utf-8');

// We will parse questions by looking for patterns like "1. ", "2. " etc.
// Since the OCR is messy, let's use a regex that finds all question blocks.

const qRegex = /(?:\[\d+\/\d+\/\d+\s+[^\]]+\]\s*.*:\s*)?(\d+)\.\s+([\s\S]*?)(?=(?:\[\d+\/\d+\/\d+\s+[^\]]+\]\s*.*:\s*)?\d+\.\s+|$)/g;

let match;
const questions = [];

let qNumber = 1;

while ((match = qRegex.exec(text)) !== null) {
  let numStr = match[1];
  let block = match[2].trim();
  
  if (parseInt(numStr) !== qNumber) {
    // some numbers like 59. 1. 2. 3. 4. 5. might get matched as questions
    if (numStr === '1' && qNumber === 60) {
      // false positive in q59
      continue;
    }
  }

  // Parse block
  let prompt = "";
  let options = [];
  let answer = "";
  let explanation = "";

  // Extract answer
  let answerMatch = block.match(/Answer\s+([A-D])(?:\.|)\s*(.*)?/i);
  if (!answerMatch) {
    // Try to find [7/17/2026...] Yeabsra: Answer
    answerMatch = block.match(/Answer\s*\n\s*([A-D])(?:\.|)\s*(.*)?/i);
  }
  
  let explanationMatch = block.match(/Explanation\s+([\s\S]*)/i);
  
  if (answerMatch) {
    answer = answerMatch[1].toUpperCase();
  }
  if (explanationMatch) {
    explanation = explanationMatch[1].trim();
  } else {
     // Some might not have explicit "Explanation" keyword or it's mis-OCR'd
     explanation = "No explanation.";
  }
  
  // Cut block up to "Answer"
  let promptAndOpts = block;
  let ansIdx = block.match(/Answer/i);
  if (ansIdx) {
    promptAndOpts = block.substring(0, ansIdx.index).trim();
  }

  // Find options A, B, C, D
  let optAIdx = promptAndOpts.match(/\nA\.\s/);
  if (!optAIdx) {
      optAIdx = promptAndOpts.match(/\nA\)\s/);
  }
  
  if (optAIdx) {
    prompt = promptAndOpts.substring(0, optAIdx.index).trim();
    let optsText = promptAndOpts.substring(optAIdx.index).trim();
    
    let optA = "", optB = "", optC = "", optD = "", optE = "";
    
    let aMatch = optsText.match(/A[\.\)]\s+([\s\S]*?)(?=\nB[\.\)]|$)/);
    let bMatch = optsText.match(/B[\.\)]\s+([\s\S]*?)(?=\nC[\.\)]|$)/);
    let cMatch = optsText.match(/C[\.\)]\s+([\s\S]*?)(?=\nD[\.\)]|$)/);
    let dMatch = optsText.match(/D[\.\)]\s+([\s\S]*?)(?=\nE[\.\)]|$)/);
    let eMatch = optsText.match(/E[\.\)]\s+([\s\S]*?)$/);
    
    if (aMatch) optA = aMatch[1].trim();
    if (bMatch) optB = bMatch[1].trim();
    if (cMatch) optC = cMatch[1].trim();
    if (dMatch) optD = dMatch[1].trim();
    if (eMatch) optE = eMatch[1].trim();
    
    const parsedOptions = [
      { key: "A", text: optA, isCorrect: answer === "A" },
      { key: "B", text: optB, isCorrect: answer === "B" },
      { key: "C", text: optC, isCorrect: answer === "C" },
      { key: "D", text: optD, isCorrect: answer === "D" }
    ];
    if (optE) {
        parsedOptions.push({ key: "E", text: optE, isCorrect: answer === "E" });
    }

    // Special cleanup for 59 and 60
    if (qNumber === 59) {
      // 59 has sub-numbers that might have been lost if we don't include them
      // Actually prompt contains the sub numbers
    }
    
    questions.push({
      key: `cabin-exam-1-q${qNumber}`,
      topicSlug: "exam 1", // For our schema
      type: "multiple_choice",
      prompt: prompt,
      explanation: explanation,
      options: parsedOptions.filter(o => o.text !== "")
    });
  } else {
    // no options found?
    console.log("No options found for Q" + qNumber);
  }

  qNumber++;
}

// Q1 has a passage before it. Let's prepend it.
const passage1 = `Walking down any high street, it's impossible not to be tempted by the discounts the major 
retailers are offering us. 'Half-price sale', 'Extra 20% off' or how about a 'BOGOF' (Buy One, Get 
One Free)? The discounts offered are huge and one wonders how shops continue to make a 
profit!
However, whilst they sound great in principle, it's worth digging a little deeper. These sorts of 
offers are displayed in the shop front purely as a means of enticing you in. The logic behind this 
is that whilst we might pop in and pick up a bargain, many of us are also likely to buy something 
at full price too.
Think about it. You've picked up an item of clothing at half price, so surely that means you can 
justify buying something else at full price as it's still less than paying full price for everything? 
But... did you plan on buying anything? We often find ourselves purchasing goods we didn't 
actually intend to buy nor did we need. Think again before you wander in to pick up that 
amazing bargain!\n\n`;

if (questions[0]) {
    questions[0].prompt = passage1 + questions[0].prompt;
}

// Q60 has a passage before it (at end of Q59). Let's extract it from Q59 explanation and prepend it to Q60.
if (questions[58] && questions[59]) {
    let q59Exp = questions[58].explanation;
    let splitExp = q59Exp.split('Safety and Health During International Travel');
    if (splitExp.length > 1) {
        questions[58].explanation = splitExp[0].trim();
        questions[59].prompt = 'Safety and Health During International Travel\n' + splitExp[1].trim() + '\n\n' + questions[59].prompt;
    }
}


const payload = {
  questionBank: {
    key: "cabin-exam-bank-1",
    slug: "cabin-exam-1",
    title: "Cabin Crew Exam 1 Bank",
    description: "Grammar, Reading, Sentence Completion",
    departmentCode: "CABIN"
  },
  examSet: {
    key: "cabin-exam-set-1",
    slug: "cabin-exam-1",
    title: "Exam 1",
    description: "Cabin Crew Exam 1",
    departmentCode: "CABIN",
    topicSlug: "exam 1",
    mode: "mock",
    durationMinutes: 90,
    published: true
  },
  questions: questions
};

fs.writeFileSync('cabin-exam-1.json', JSON.stringify(payload, null, 2));
console.log('Wrote cabin-exam-1.json with', questions.length, 'questions.');
