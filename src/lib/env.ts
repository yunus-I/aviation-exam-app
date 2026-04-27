import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("EAU Entrance Prep"),
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_BOT_WEBHOOK_SECRET: z.string().min(1).optional(),
  TELEGRAM_ADMIN_CHAT_ID: z.string().min(1).optional(),
  TELEGRAM_APPROVAL_NOTICE_MINUTES: z.string().default("60"),
  NEXT_PUBLIC_MINI_APP_URL: z.string().url().optional(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME:
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_BOT_WEBHOOK_SECRET: process.env.TELEGRAM_BOT_WEBHOOK_SECRET,
  TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID,
  TELEGRAM_APPROVAL_NOTICE_MINUTES:
    process.env.TELEGRAM_APPROVAL_NOTICE_MINUTES,
  NEXT_PUBLIC_MINI_APP_URL: process.env.NEXT_PUBLIC_MINI_APP_URL,
});
