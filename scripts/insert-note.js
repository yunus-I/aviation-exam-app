const { createClient } = require("@supabase/supabase-js");
const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");

const projectDir = process.cwd();
const envPath = resolve(projectDir, ".env");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const content = `1. Advanced Reading Comprehension & Information Evaluation

Categorizing Absolute vs. Conditional Statements

In the reading section, the exam tests your ability to separate general facts from absolute traps. Pay close attention to words like all, exclusively, or never versus conditional phrases like typically, most, or can combine. As seen in the cloud computing and photosynthesis passages, a statement is often marked False if it takes a nuanced process (such as hybrid architectures or specific organisms creating glucose) and incorrectly claims it applies universally. Training your eye to spot these absolute quantifiers will prevent you from falling into traps on true/false questions.

Fact Extraction and Structural Flow

Cabin crew members must process technical manuals quickly and accurately. The exam replicates this by testing your literal comprehension of specialized processes. To maximize your score, map the passage's structural flow: look for cause-and-effect indicators (such as "byproduct," "serves as a foundational source," or "relies on") to connect inputs to their correct outputs. Always validate your answer directly against the text rather than using outside knowledge, ensuring that if a text states a process happens in a specific stage, you do not accidentally attribute it to another.

2. Professional Spelling & Administrative Error Correction

Master Core Aviation and Business Spellings

The spelling evaluation segment targets highly specific structural patterns in the English language that frequently appear in corporate and aviation communication. You must master words that feature tricky double consonants, silent vowels, or exceptions to common spelling rules. Focus heavily on memorizing the precise structures of words like Occurrence (double 'c', double 'r', ending in -ence), Maintenance (which drops the 'i' from its root verb maintain), Leisure (which violates the standard "i before e" rule), and Unnecessary (one 'n' from the prefix un- combined with the double 'c' and double 's' of necessary).

Eliminating Adverbial Spelling Traps

Another high-yield area on the entrance exam involves identifying correct adverbial suffixes, particularly when dealing with words ending in "-ly". A classic trap tested in the bank is the word Publicly. Many students mistakenly write "publically" because they assume it follows the pattern of words like drastically or logically. Remembering that public transitions directly to publicly without adding an extra syllable will save you crucial points in the error-correction section.

3. High-Tier Vocabulary, Synonyms, and Antonyms

Positive Reinforcement and Support Terminology

As a cabin crew candidate, your vocabulary must reflect absolute professionalism, clarity, and control under pressure. The exam frequently evaluates your command of terms related to strengthening, clarifying, and approving. Ensure you thoroughly understand synonyms and antonyms for words like Bolster (synonym: reinforce; antonym: weaken), Lucid (synonym: clear; antonym: vague), Acquiesce (synonym: consent; antonym: protest), and Cognizant (synonym: aware; antonym: ignorant). These words simulate your ability to read operational updates and understand instructions clearly.

Managing Descriptions of Behavior and Change

A significant portion of the vocabulary test measures your ability to identify personality traits and operational fluctuations. You will be tested on your knowledge of stubborn or erratic behaviors versus compliant ones, using words like Obdurate or Recalcitrant (synonym: obstinate/rebellious; antonym: yielding/compliant). Additionally, you must master terms that dictate time and consistency, such as Transient and Ephemeral (meaning temporary or fleeting), and contrast them against their permanent opposites like perpetual or eternal.

4. Sentence Completion & Contextual Logic

Navigating Double-Blank Context Clues

The sentence completion section requires you to evaluate the psychological and operational context of a corporate environment. When facing double-blank questions, analyze the sentence for pivot words like although, while, or because. If a sentence begins with although, the two blanks must represent contrasting ideas—such as a design being visually elegant but financially too expensive for a budget. If the sentence uses because or due to, look for cause-and-effect pairs, such as a material shortage forcing a facility to temporarily suspend operations.

Aviation Security and Operational Protocol Logic

Many grammar and vocabulary context questions are set within IT security, compliance, and medical emergencies to mirror the high-stakes environment of an aircraft. You must select word pairings that favor safety, proactive management, and strict protocol. Practice identifying pairs where actions must be performed systematically to prevent bad actors from exploiting a vulnerability, or where sensitive data must be encrypted before it is stored. In this exam, the correct answer path will always favor orderly, immediate, and rule-following professional behavior.

5. Core Grammar, Transitions, and Comparative Structures

Mastering Conjunctive Adverbs and Transitions

To pass the structure section, you must perfectly deploy transition words based on the relationship between two independent clauses. Use Consequently or Therefore when the second clause is a direct result of the first (e.g., a power surge occurring; consequently, databases became inaccessible). Use Nevertheless or However when the second clause introduces an unexpected contrast or defiance of the first clause (e.g., encountering critical technical glitches; nevertheless, the client was highly impressed).

Comparative Adverbs and Past Perfect Tense

Finally, the exam heavily tests your technical command of modifier mechanics and timeline tenses. When comparing a person or a system to peers or past performance, always use the correct comparative adverb form, such as solving problems more quickly or processing data more gracefully or faster (never "more fast"). For timeline grammar, remember to use the past perfect tense (had reviewed) when describing an action that was completed thoroughly before another past action officially began.`;

  // Check if it already exists
  let { data: existing, error: fetchError } = await supabase
    .from('notes')
    .select('id')
    .eq('title', 'Cabin Crew Note 1')
    .single();

  if (existing) {
    console.log('Updating existing note', existing.id);
    const { data, error } = await supabase
      .from('notes')
      .update({ content, dept: 'CABIN' })
      .eq('id', existing.id);
    if (error) console.error(error);
    else console.log('Successfully updated.');
  } else {
    console.log('Inserting new note...');
    const { data, error } = await supabase
      .from('notes')
      .insert([{ dept: 'CABIN', title: 'Cabin Crew Note 1', content }]);
    if (error) console.error(error);
    else console.log('Successfully inserted.');
  }
}

main();
