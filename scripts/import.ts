import { readFileSync } from "fs";
import { resolve } from "path";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { ExamContentRepository } from "../src/features/exam/repository";
import { getSupabaseAdminClient } from "../src/lib/supabase/admin";

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const adminTelegramId = args[1];

  if (!filePath || !adminTelegramId) {
    console.error("Usage: npm run import-content <path-to-json> <admin-telegram-user-id>");
    console.error("Example: npm run import-content ./exam-data.json 123456789");
    process.exit(1);
  }

  const absolutePath = resolve(process.cwd(), filePath);
  console.log(`Reading file: ${absolutePath}`);

  try {
    const fileContent = readFileSync(absolutePath, "utf-8");
    const payload = JSON.parse(fileContent);

    console.log("Connecting to Supabase...");
    
    // Validate admin exists
    const supabase = getSupabaseAdminClient();
    const adminCheck = await supabase
      .from("admin_accounts")
      .select("id")
      .eq("telegram_user_id", Number(adminTelegramId))
      .single();
      
    if (adminCheck.error || !adminCheck.data) {
      console.error(`Error: Admin with Telegram ID ${adminTelegramId} not found in admin_accounts table.`);
      process.exit(1);
    }

    console.log("Admin verified. Starting import...");

    const repository = new ExamContentRepository();
    const result = await repository.importContentPackage(payload, Number(adminTelegramId));

    console.log("✅ Import completed successfully!");
    console.log(`Imported Exam Set ID: ${result.examSetId}`);
    console.log(`Imported Questions: ${result.importedQuestionCount}`);
    console.log(`Total Points: ${result.totalPoints}`);
    
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

main();
