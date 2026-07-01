-- Add email column to admin_accounts for Supabase Auth integration
alter table public.admin_accounts
  add column if not exists email text unique;

-- Allow admins to sign in via email using Supabase Auth
-- The email column will be linked to the Supabase Auth user's email
-- Run this manually after creating the Supabase Auth user:
--   update public.admin_accounts set email = '<admin-email>' where telegram_user_id = <telegram-id>;
