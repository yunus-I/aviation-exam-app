insert into public.departments (slug, code, name_en, name_am, description_en, description_am)
values
  ('amt-maintenance', 'AMT', 'AMT Maintenance', 'የአውሮፕላን ጥገና', 'Mechanical reasoning, maintenance-oriented, and technical entrance preparation.', 'የመካኒካል አስተሳሰብ፣ የጥገና አቅም እና ቴክኒካል የመግቢያ ዝግጅት።'),
  ('cabin-crew', 'CABIN', 'Cabin Crew', 'ካቢን ክሩ', 'Customer-facing communication, reasoning, and service preparation.', 'የደንበኛ አገልግሎት፣ ኮሙኒኬሽን እና አስተሳሰብ የመግቢያ ዝግጅት።'),
  ('marketing', 'MKT', 'Marketing', 'ማርኬቲንግ', 'Business, communication, and quantitative entrance preparation.', 'የንግድ፣ የኮሙኒኬሽን እና የቁጥር አስተሳሰብ የመግቢያ ዝግጅት።'),
  ('pilot', 'PILOT', 'Pilot', 'ፓይለት', 'Math, aptitude, and aviation-oriented entrance preparation.', 'የሂሳብ፣ አፕቲቱድ እና የአቪዬሽን የመግቢያ ዝግጅት።')
on conflict (slug) do nothing;

insert into public.regions (slug, name_en, name_am)
values
  ('addis-ababa', 'Addis Ababa', 'አዲስ አበባ'),
  ('afar', 'Afar', 'አፋር'),
  ('amhara', 'Amhara', 'አማራ'),
  ('benishangul-gumuz', 'Benishangul-Gumuz', 'ቤንሻንጉል ጉሙዝ'),
  ('central-ethiopia', 'Central Ethiopia', 'ማዕከላዊ ኢትዮጵያ'),
  ('dire-dawa', 'Dire Dawa', 'ድሬዳዋ'),
  ('gambela', 'Gambela', 'ጋምቤላ'),
  ('harari', 'Harari', 'ሐረሪ'),
  ('oromia', 'Oromia', 'ኦሮሚያ'),
  ('sidama', 'Sidama', 'ሲዳማ'),
  ('somali', 'Somali', 'ሶማሊ'),
  ('south-ethiopia', 'South Ethiopia', 'ደቡብ ኢትዮጵያ'),
  ('south-west-ethiopia-peoples', 'South West Ethiopia Peoples', 'ደቡብ ምዕራብ ኢትዮጵያ ሕዝቦች'),
  ('tigray', 'Tigray', 'ትግራይ')
on conflict (slug) do nothing;

insert into public.topics (slug, name_en, name_am, description_en, description_am)
values
  ('mechanical-reasoning', 'Mechanical Reasoning', 'መካኒካል አስተሳሰብ', 'Mechanical concepts and technical understanding.', 'የመካኒካል ግንዛቤ እና ቴክኒካል አስተዋጽኦ።'),
  ('aptitude', 'Aptitude', 'አፕቲቱድ', 'General aptitude and entrance readiness questions.', 'አጠቃላይ አፕቲቱድ እና የመግቢያ ዝግጅት ጥያቄዎች።'),
  ('reasoning', 'Reasoning', 'ሎጂካል አስተሳሰብ', 'Verbal and non-verbal reasoning practice.', 'የቃላዊ እና የእይታ አስተሳሰብ ልምምድ።'),
  ('mathematics', 'Mathematics', 'ሂሳብ', 'Quantitative and problem-solving preparation.', 'የቁጥር አስተሳሰብ እና የችግኝ ፍታት ዝግጅት።'),
  ('english', 'English', 'እንግሊዝኛ', 'Language comprehension and usage practice.', 'የቋንቋ ግንዛቤ እና አጠቃቀም ልምምድ።'),
  ('money-and-business', 'Money and Business', 'ገንዘብ እና ንግድ', 'Basic money, commerce, and business entrance questions.', 'መሠረታዊ የገንዘብ፣ የንግድ እና የቢዝነስ ጥያቄዎች።')
on conflict (slug) do nothing;

insert into public.admin_accounts (telegram_user_id, telegram_username, display_name, is_super_admin, is_active)
values (5827966050, 'kcyslo', 'Main Admin', true, true)
on conflict (telegram_user_id) do update
set telegram_username = excluded.telegram_username, display_name = excluded.display_name, is_super_admin = excluded.is_super_admin, is_active = excluded.is_active;
