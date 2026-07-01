import https from "https";

const PROJECT_REF = "irasmbfqhrrsdtmgpzrf";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  process.exit(1);
}

const queries = [
  `alter table public.admin_accounts add column if not exists email text unique;`,
  `
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values (
  'question-images',
  'question-images',
  true,
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;
create policy "Public read access" on storage.objects
  for select using (bucket_id = 'question-images');
create policy "Admin insert access" on storage.objects
  for insert with check (bucket_id = 'question-images');
create policy "Admin delete access" on storage.objects
  for delete using (bucket_id = 'question-images');
  `,
  `
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.admin_accounts
    where email = auth.jwt() ->> 'email' and is_active = true
  );
$$;
  `,
];

for (const table of [
  "departments", "regions", "admin_accounts", "candidates",
  "registration_submissions", "registration_reviews", "topics",
  "question_banks", "questions", "question_media", "question_options",
  "exam_sets", "exam_set_questions", "exam_attempts", "attempt_answers",
]) {
  queries.push(`
create policy "Admin full access on ${table}" on public.${table}
  for all using (public.is_admin()) with check (public.is_admin());
  `);
}

async function runQuery(query) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.supabase.com",
        path: `/v1/projects/${PROJECT_REF}/sql`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`${res.statusCode}: ${data}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(JSON.stringify({ query }));
    req.end();
  });
}

async function main() {
  for (let i = 0; i < queries.length; i++) {
    const label = `Migration ${i + 1}/${queries.length}`;
    process.stdout.write(`${label}... `);
    try {
      await runQuery(queries[i]);
      console.log("OK");
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
    }
  }

  console.log("\n--- Now link your email ---");
  console.log("Run this in Supabase SQL Editor:");
  console.log(
    "  update public.admin_accounts set email = 'YOUR_EMAIL' where telegram_user_id = 5827966050;",
  );
}

main().catch(console.error);
