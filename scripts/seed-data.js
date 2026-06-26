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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Insert departments
  const depts = [
    { slug: "amt-maintenance", code: "AMT", name_en: "AMT Maintenance", name_am: "የአውሮፕላን ጥገና", description_en: "Mechanical reasoning, maintenance-oriented, and technical entrance preparation.", description_am: "የመካኒካል አስተሳሰብ፣ የጥገና አቅም እና ቴክኒካል የመግቢያ ዝግጅት።" },
    { slug: "cabin-crew", code: "CABIN", name_en: "Cabin Crew", name_am: "ካቢን ክሩ", description_en: "Customer-facing communication, reasoning, and service preparation.", description_am: "የደንበኛ አገልግሎት፣ ኮሙኒኬሽን እና አስተሳሰብ የመግቢያ ዝግጅት።" },
    { slug: "marketing", code: "MKT", name_en: "Marketing", name_am: "ማርኬቲንግ", description_en: "Business, communication, and quantitative entrance preparation.", description_am: "የንግድ፣ የኮሙኒኬሽን እና የቁጥር አስተሳሰብ የመግቢያ ዝግጅት።" },
    { slug: "pilot", code: "PILOT", name_en: "Pilot", name_am: "ፓይለት", description_en: "Math, aptitude, and aviation-oriented entrance preparation.", description_am: "የሂሳብ፣ አፕቲቱድ እና የአቪዬሽን የመግቢያ ዝግጅት።" },
  ];

  for (const d of depts) {
    const { data, error } = await supabase.from("departments").upsert(d, { onConflict: "slug" }).select("id").single();
    if (error) console.error("Dept error:", error.message, d.slug);
    else console.log("Dept:", d.slug, data.id);
  }

  // Insert regions
  const regions = [
    { slug: "addis-ababa", name_en: "Addis Ababa", name_am: "አዲስ አበባ" },
    { slug: "afar", name_en: "Afar", name_am: "አፋር" },
    { slug: "amhara", name_en: "Amhara", name_am: "አማራ" },
    { slug: "benishangul-gumuz", name_en: "Benishangul-Gumuz", name_am: "ቤንሻንጉል ጉሙዝ" },
    { slug: "central-ethiopia", name_en: "Central Ethiopia", name_am: "ማዕከላዊ ኢትዮጵያ" },
    { slug: "dire-dawa", name_en: "Dire Dawa", name_am: "ድሬዳዋ" },
    { slug: "gambela", name_en: "Gambela", name_am: "ጋምቤላ" },
    { slug: "harari", name_en: "Harari", name_am: "ሐረሪ" },
    { slug: "oromia", name_en: "Oromia", name_am: "ኦሮሚያ" },
    { slug: "sidama", name_en: "Sidama", name_am: "ሲዳማ" },
    { slug: "somali", name_en: "Somali", name_am: "ሶማሊ" },
    { slug: "south-ethiopia", name_en: "South Ethiopia", name_am: "ደቡብ ኢትዮጵያ" },
    { slug: "south-west-ethiopia-peoples", name_en: "South West Ethiopia Peoples", name_am: "ደቡብ ምዕራብ ኢትዮጵያ ሕዝቦች" },
    { slug: "tigray", name_en: "Tigray", name_am: "ትግራይ" },
  ];

  for (const r of regions) {
    const { error } = await supabase.from("regions").upsert(r, { onConflict: "slug" });
    if (error) console.error("Region error:", error.message, r.slug);
    else console.log("Region:", r.slug);
  }

  // Insert topics
  const topics = [
    { slug: "mechanical-reasoning", name_en: "Mechanical Reasoning", name_am: "መካኒካል አስተሳሰብ" },
    { slug: "aptitude", name_en: "Aptitude", name_am: "አፕቲቱድ" },
    { slug: "reasoning", name_en: "Reasoning", name_am: "ሎጂካል አስተሳሰብ" },
    { slug: "mathematics", name_en: "Mathematics", name_am: "ሂሳብ" },
    { slug: "english", name_en: "English", name_am: "እንግሊዝኛ" },
    { slug: "money-and-business", name_en: "Money and Business", name_am: "ገንዘብ እና ንግድ" },
  ];

  for (const t of topics) {
    const { error } = await supabase.from("topics").upsert(t, { onConflict: "slug" });
    if (error) console.error("Topic error:", error.message, t.slug);
    else console.log("Topic:", t.slug);
  }

  // Insert admin
  const { data: admin, error: adminErr } = await supabase.from("admin_accounts").upsert({
    telegram_user_id: 5827966050,
    telegram_username: "kcyslo",
    display_name: "Main Admin",
    is_super_admin: true,
    is_active: true,
  }, { onConflict: "telegram_user_id" }).select("id").single();

  if (adminErr) console.error("Admin error:", adminErr);
  else console.log("Admin ID:", admin.id);

  console.log("\nAll seed data inserted!");
}

main().catch(console.error);
