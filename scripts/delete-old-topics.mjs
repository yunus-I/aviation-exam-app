import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const OLD_SUBJECTS = [
  "aptitude",
  "english",
  "mathematics",
  "mechanical-reasoning",
  "money-and-business",
  "reasoning",
];

async function cleanup() {
  console.log("Cleaning up old subjects from topics table...");

  const { data: topicsToDelete } = await supabase
    .from("topics")
    .select("id, slug")
    .in("slug", [...OLD_SUBJECTS, "mechanical reasoning", "money and business"]);

  if (topicsToDelete && topicsToDelete.length > 0) {
    const topicIds = topicsToDelete.map(t => t.id);

    // Fetch and delete questions in a loop to handle >1000 rows
    let hasMoreQuestions = true;
    while (hasMoreQuestions) {
      const { data: questions } = await supabase
        .from("questions")
        .select("id")
        .in("topic_id", topicIds)
        .limit(1000);

      if (questions && questions.length > 0) {
        const qIds = questions.map(q => q.id);
        console.log(`Deleting options for ${qIds.length} questions...`);
        for (let i = 0; i < qIds.length; i += 100) {
          const chunk = qIds.slice(i, i + 100);
          await supabase.from("question_options").delete().in("question_id", chunk);
        }
        
        console.log(`Deleting ${qIds.length} questions...`);
        for (let i = 0; i < qIds.length; i += 100) {
          const chunk = qIds.slice(i, i + 100);
          await supabase.from("questions").delete().in("id", chunk);
        }
      } else {
        hasMoreQuestions = false;
      }
    }

    console.log("Deleting dependent question_banks...");
    await supabase.from("question_banks").delete().in("topic_id", topicIds);

    for (const t of topicsToDelete) {
      const { error } = await supabase.from("topics").delete().eq("id", t.id);
      if (error) {
        console.error(`Failed to delete topic ${t.slug}:`, error.message);
      } else {
        console.log(`Deleted topic: ${t.slug}`);
      }
    }
  } else {
    console.log("No old topics found.");
  }

  console.log("Cleanup complete!");
}

cleanup().catch(console.error);
