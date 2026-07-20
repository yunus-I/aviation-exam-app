insert into public.departments (
  slug,
  code,
  name_en,
  name_am,
  description_en,
  description_am,
  is_active
)
values (
  'others',
  'OTHERS',
  'Others',
  'ሌሎች',
  'General entrance preparation for other aviation university departments.',
  'ለሌሎች የአቪዬሽን ዩኒቨርሲቲ ዲፓርትመንቶች የመግቢያ ዝግጅት።',
  true
)
on conflict (slug) do update set
  code = excluded.code,
  name_en = excluded.name_en,
  name_am = excluded.name_am,
  description_en = excluded.description_en,
  description_am = excluded.description_am,
  is_active = excluded.is_active;
