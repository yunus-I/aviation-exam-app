import { readFileSync } from "fs";
import { resolve } from "path";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const { ExamContentRepository } = await import("../src/features/exam/repository");
  const { getSupabaseAdminClient } = await import("../src/lib/supabase/admin");

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
      if (adminCheck.error?.code === "PGRST205") {
        console.error("Error: Supabase project has no REST schema for admin_accounts. Check that migrations have been applied to the connected database.");
      } else {
        console.error(`Error: Admin with Telegram ID ${adminTelegramId} not found in admin_accounts table.`);
      }
      if (adminCheck.error) {
        console.error("Supabase query error:", adminCheck.error);
      }
      console.error("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      process.exitCode = 1;
      return;
    }

    console.log("Admin verified. Starting import...");

    const repository = new ExamContentRepository();
    const result = await repository.importContentPackage(payload, Number(adminTelegramId));

    console.log("✅ Import completed successfully!");
    console.log(`Imported Exam Set ID: ${result.examSetId}`);
    console.log(`Imported Questions: ${result.importedQuestionCount}`);
    
  } catch (error) {
    console.error("❌ Import failed:", error);
    console.error("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    process.exitCode = 1;
  }
}

main();
