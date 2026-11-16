-- Sample catalogue. Safe to run more than once.

insert into public.courses (slug, title, summary, description, level, topic, price_cents, published)
values ('fdm-fundamentals', 'FDM Fundamentals', 'From a bare spool to a clean first layer. Everything you need to run a filament printer with confidence.', 'Understand how fused deposition works, level and calibrate a machine, choose materials, and diagnose the failures every beginner meets. By the end you will print functional parts on purpose, not by luck.', 'Beginner', 'FDM', 4900, true)
on conflict (slug) do nothing;

insert into public.lessons (course_id, position, title, duration_seconds, is_free)
select c.id, v.position, v.title, v.duration_seconds, v.is_free
from public.courses c, (values
  (0, 'How a filament printer builds a part', 540, true),
  (1, 'Bed levelling and the first layer', 840, false),
  (2, 'PLA, PETG, ABS: picking a material', 720, false),
  (3, 'Temperature, speed and cooling', 960, false),
  (4, 'Reading a failed print', 780, false),
  (5, 'Your first functional part', 1080, false)
) as v (position, title, duration_seconds, is_free)
where c.slug = 'fdm-fundamentals'
  and not exists (select 1 from public.lessons l where l.course_id = c.id);

insert into public.courses (slug, title, summary, description, level, topic, price_cents, published)
values ('design-for-additive', 'Design for Additive Manufacturing', 'Stop designing for the mill. Model parts that are lighter, stronger and print without supports.', 'Overhangs, bridges, wall thickness, orientation and anisotropy: the rules that decide whether a model prints well. Worked examples take three real brackets from CAD to finished part.', 'Intermediate', 'Design', 8900, true)
on conflict (slug) do nothing;

insert into public.lessons (course_id, position, title, duration_seconds, is_free)
select c.id, v.position, v.title, v.duration_seconds, v.is_free
from public.courses c, (values
  (0, 'Thinking in layers', 480, true),
  (1, 'Overhangs, bridges and the 45° rule', 900, false),
  (2, 'Orientation and part strength', 1020, false),
  (3, 'Tolerances and fits that work', 840, false),
  (4, 'Lattices and lightweighting', 1140, false),
  (5, 'Case study: a bracket, three ways', 1320, false)
) as v (position, title, duration_seconds, is_free)
where c.slug = 'design-for-additive'
  and not exists (select 1 from public.lessons l where l.course_id = c.id);

insert into public.courses (slug, title, summary, description, level, topic, price_cents, published)
values ('resin-printing', 'Resin Printing, Safely', 'SLA and MSLA from vat to cure, with the handling habits that keep a workshop clean.', 'Resin gives detail filament cannot, and it demands more care. Set up a safe station, support delicate models, dial in exposure and post-cure parts to full strength.', 'Beginner', 'Resin', 5900, true)
on conflict (slug) do nothing;

insert into public.lessons (course_id, position, title, duration_seconds, is_free)
select c.id, v.position, v.title, v.duration_seconds, v.is_free
from public.courses c, (values
  (0, 'How light cures a layer', 420, true),
  (1, 'Setting up a safe resin station', 720, false),
  (2, 'Supports and orientation for detail', 960, false),
  (3, 'Exposure calibration', 780, false),
  (4, 'Washing and curing', 600, false)
) as v (position, title, duration_seconds, is_free)
where c.slug = 'resin-printing'
  and not exists (select 1 from public.lessons l where l.course_id = c.id);

insert into public.courses (slug, title, summary, description, level, topic, price_cents, published)
values ('metal-am-intro', 'Introduction to Metal AM', 'Powder bed fusion, binder jetting and DED explained for engineers evaluating metal parts.', 'A clear map of the metal processes: what each is good at, what it costs, and where the hidden work is. Covers powder handling, build preparation, heat treatment and inspection.', 'Advanced', 'Metal', 14900, true)
on conflict (slug) do nothing;

insert into public.lessons (course_id, position, title, duration_seconds, is_free)
select c.id, v.position, v.title, v.duration_seconds, v.is_free
from public.courses c, (values
  (0, 'The metal process landscape', 660, true),
  (1, 'Laser powder bed fusion in depth', 1260, false),
  (2, 'Supports, stress and distortion', 1080, false),
  (3, 'Heat treatment and HIP', 900, false),
  (4, 'Inspection and qualification', 1020, false),
  (5, 'Is this part a good candidate?', 840, false)
) as v (position, title, duration_seconds, is_free)
where c.slug = 'metal-am-intro'
  and not exists (select 1 from public.lessons l where l.course_id = c.id);

insert into public.courses (slug, title, summary, description, level, topic, price_cents, published)
values ('slicer-mastery', 'Slicer Mastery', 'The settings that matter, the ones that do not, and how to build profiles you can trust.', 'Go past the default profile. Learn what each group of slicer settings changes in the physical part, then tune for speed, strength or surface finish.', 'Intermediate', 'Software', 6900, true)
on conflict (slug) do nothing;

insert into public.lessons (course_id, position, title, duration_seconds, is_free)
select c.id, v.position, v.title, v.duration_seconds, v.is_free
from public.courses c, (values
  (0, 'What a slicer really does', 480, true),
  (1, 'Walls, infill and strength', 900, false),
  (2, 'Supports without the scars', 840, false),
  (3, 'Speed and acceleration tuning', 960, false),
  (4, 'Building a profile library', 660, false)
) as v (position, title, duration_seconds, is_free)
where c.slug = 'slicer-mastery'
  and not exists (select 1 from public.lessons l where l.course_id = c.id);

insert into public.courses (slug, title, summary, description, level, topic, price_cents, published)
values ('post-processing', 'Post-Processing and Finishing', 'Sanding, smoothing, priming and painting: take a raw print to a showroom surface.', 'A finishing workflow for every budget. Remove supports cleanly, fill layer lines, smooth with vapour or filler primer, and paint parts that look moulded.', 'Beginner', 'Finishing', 0, true)
on conflict (slug) do nothing;

insert into public.lessons (course_id, position, title, duration_seconds, is_free)
select c.id, v.position, v.title, v.duration_seconds, v.is_free
from public.courses c, (values
  (0, 'Removing supports cleanly', 540, true),
  (1, 'Sanding and filling layer lines', 780, true),
  (2, 'Priming for paint', 600, true),
  (3, 'Painting and clear coats', 900, true)
) as v (position, title, duration_seconds, is_free)
where c.slug = 'post-processing'
  and not exists (select 1 from public.lessons l where l.course_id = c.id);
