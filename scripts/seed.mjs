import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MODES = [
  { slug: "practice 1", name_en: "Practice 1" },
  { slug: "practice 2", name_en: "Practice 2" },
  { slug: "practice 3", name_en: "Practice 3" },
  { slug: "practice 4", name_en: "Practice 4" },
  { slug: "exam 1", name_en: "Exam 1" },
  { slug: "exam 2", name_en: "Exam 2" },
  { slug: "exam 3", name_en: "Exam 3" },
];

async function seed() {
  console.log("Seeding new modes as topics...");

  // 1. Insert modes into topics table
  const insertedTopics = [];
  for (const mode of MODES) {
    const { data, error } = await supabase
      .from("topics")
      .upsert({ slug: mode.slug, name_en: mode.name_en }, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      console.error(`Failed to upsert topic ${mode.slug}:`, error.message);
    } else {
      insertedTopics.push(data);
      console.log(`Upserted topic: ${mode.slug}`);
    }
  }

  // 2. Fetch the AMT department ID
  const { data: deptData, error: deptError } = await supabase
    .from("departments")
    .select("id")
    .eq("code", "AMT")
    .single();

  if (deptError || !deptData) {
    console.error("Failed to find AMT department:", deptError?.message);
    process.exit(1);
  }

  const amtDeptId = deptData.id;

  // 3. Insert sample questions for AMT
  for (const topic of insertedTopics) {
    const sampleQuestion = {
      department_id: amtDeptId,
      topic_id: topic.id,
      prompt_en: `Sample question for ${topic.name_en} - AMT`,
      explanation_en: `This is the explanation for ${topic.name_en} sample question.`,
      question_type: "single_choice",
      is_active: true,
      duration_minutes: 2,
    };

    const { data: qData, error: qError } = await supabase
      .from("questions")
      .insert(sampleQuestion)
      .select()
      .single();

    if (qError) {
      console.error(`Failed to insert question for ${topic.slug}:`, qError.message);
      continue;
    }

    // Insert options
    const options = [
      { question_id: qData.id, option_key: "A", option_text_en: "Correct Option", is_correct: true, sort_order: 1 },
      { question_id: qData.id, option_key: "B", option_text_en: "Wrong Option 1", is_correct: false, sort_order: 2 },
      { question_id: qData.id, option_key: "C", option_text_en: "Wrong Option 2", is_correct: false, sort_order: 3 },
      { question_id: qData.id, option_key: "D", option_text_en: "Wrong Option 3", is_correct: false, sort_order: 4 },
    ];

    const { error: optError } = await supabase.from("question_options").insert(options);

    if (optError) {
      console.error(`Failed to insert options for ${topic.slug}:`, optError.message);
    } else {
      console.log(`Successfully created sample question and options for ${topic.slug}`);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
