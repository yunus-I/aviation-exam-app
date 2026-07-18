import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
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

    console.log("Migrations completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
