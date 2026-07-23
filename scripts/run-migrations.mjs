import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

// Convert direct db.[ref].supabase.co to pooler URL if legacy format is passed
if (connectionString.includes("db.irasmbfqhrrsdtmgpzrf.supabase.co")) {
  connectionString = connectionString.replace(
    "postgres:1Y2y3y4y5y6y7y8y@db.irasmbfqhrrsdtmgpzrf.supabase.co:5432",
    "postgres.irasmbfqhrrsdtmgpzrf:1Y2y3y4y5y6y7y8y@aws-0-eu-west-1.pooler.supabase.com:6543"
  );
}

const client = new Client({ connectionString });

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to database.");

    // 1. Create notes table
    console.log("Creating notes table if it does not exist...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notes (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        dept text NOT NULL,
        title text NOT NULL,
        content text NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    // 2. Add passage_text to questions
    console.log("Adding passage_text column to questions table...");
    try {
      await client.query(`
        ALTER TABLE public.questions
        ADD COLUMN passage_text TEXT;
      `);
      console.log("Column passage_text added.");
    } catch (err) {
      if (err.code === '42701') {
        console.log("Column passage_text already exists. Skipping.");
      } else {
        throw err;
      }
    }

    // 3. Add instruction_text to questions
    console.log("Adding instruction_text column to questions table...");
    try {
      await client.query(`
        ALTER TABLE public.questions
        ADD COLUMN instruction_text TEXT;
      `);
      console.log("Column instruction_text added.");
    } catch (err) {
      if (err.code === '42701') {
        console.log("Column instruction_text already exists. Skipping.");
      } else {
        throw err;
      }
    }

    // 4. Add set_name to notes (if missing)
    console.log("Adding set_name column to notes table...");
    try {
      await client.query(`
        ALTER TABLE public.notes
        ADD COLUMN set_name TEXT NOT NULL DEFAULT 'Note 1';
      `);
      console.log("Column set_name added.");
    } catch (err) {
      if (err.code === '42701') {
        console.log("Column set_name already exists. Skipping.");
      } else {
        throw err;
      }
    }

    // 5. Ensure 'others' department exists in departments table
    console.log("Ensuring 'others' department exists in departments table...");
    await client.query(`
      INSERT INTO public.departments (id, slug, code, name_en, name_am, description_en, description_am, is_active)
      VALUES (
        'e4776101-7006-444a-9b49-b5f7781b0a88',
        'others',
        'OTHERS',
        'Others',
        'ሌሎች',
        'Other departments and general entrance preparation.',
        'ሌሎች የትምህርት ክፍሎች እና አጠቃላይ የመግቢያ ዝግጅት።',
        true
      )
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Department 'others' ensured.");

    console.log("Migrations completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
