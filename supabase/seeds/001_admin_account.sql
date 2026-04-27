-- Replace the placeholder values before running this seed.
-- The telegram_user_id should be your personal Telegram numeric user id.

insert into public.admin_accounts (
  telegram_user_id,
  telegram_username,
  display_name,
  is_super_admin,
  is_active
)
values (
  5827966050,
  'kcyslo',
  'Main Admin',
  true,
  true
)
on conflict (telegram_user_id) do update
set
  telegram_username = excluded.telegram_username,
  display_name = excluded.display_name,
  is_super_admin = excluded.is_super_admin,
  is_active = excluded.is_active;
