import https from "https";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT = "irasmbfqhrrsdtmgpzrf";

if (!TOKEN) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

function runSQL(query) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.supabase.com",
        path: `/v1/projects/${PROJECT}/database/query`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          if (res.statusCode < 300) resolve(data);
          else reject(new Error(`${res.statusCode}: ${data}`));
        });
      },
    );
    req.on("error", reject);
    req.write(JSON.stringify({ query }));
    req.end();
  });
}

async function main() {
  console.log("1. Adding email column to admin_accounts...");
  await runSQL(
    "alter table public.admin_accounts add column if not exists email text unique;",
  );
  console.log("   OK");

  console.log("2. Creating question-images bucket...");
  await runSQL(`
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values ('question-images', 'question-images', true, false, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;
  `);
  console.log("   OK");

  console.log("   Adding storage policies...");
  for (const [name, sql] of [
    ["question_images_public_select", `create policy "question_images_public_select" on storage.objects for select using (bucket_id = 'question-images');`],
    ["question_images_admin_insert", `create policy "question_images_admin_insert" on storage.objects for insert with check (bucket_id = 'question-images');`],
    ["question_images_admin_delete", `create policy "question_images_admin_delete" on storage.objects for delete using (bucket_id = 'question-images');`],
  ]) {
    try {
      await runSQL(sql);
    } catch (e) {
      // policy might already exist, that's fine
    }
    process.stdout.write(".");
  }
  console.log(" OK");

  console.log("3. Creating is_admin() function...");
  await runSQL(`
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.admin_accounts
    where email = auth.jwt() ->> 'email' and is_active = true
  );
$$;
  `);
  console.log("   OK");

  console.log("   Adding RLS policies...");
  const tables = [
    "departments",
    "regions",
    "admin_accounts",
    "candidates",
    "registration_submissions",
    "registration_reviews",
    "topics",
    "question_banks",
    "questions",
    "question_media",
    "question_options",
    "exam_sets",
    "exam_set_questions",
    "exam_attempts",
    "attempt_answers",
  ];

  for (const t of tables) {
    try {
      await runSQL(`
create policy "admin_full_${t}" on public.${t}
  for all using (public.is_admin()) with check (public.is_admin());
      `);
    } catch (e) {
      // policy likely exists already
    }
    process.stdout.write(".");
  }
  console.log(" OK");

  console.log("\nAll migrations applied successfully!");
  console.log("\nNext step — link your email:");
  console.log(
    '  update public.admin_accounts set email = \'YOUR_EMAIL\' where telegram_user_id = 5827966050;',
  );
}

main().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
