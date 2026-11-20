-- 1) Dues notes més a les plataformes, comprovades a la pàgina de cada una el 20/11/2026: Google (4,1 de 5, 2.911 ressenyes) es
--    publica; Tripadvisor (3,8 de 5, 1.195 opinions) entra en esborrany, perquè és la nota més baixa i el càmping decideix si la vol.
--    Només si encara no hi són (el client les podria haver afegit des del panell).
insert into public.review_platforms (platform, rating, scale, review_count, url, sort_order, status)
select v.platform, v.rating, v.scale, v.review_count, v.url, v.sort_order, v.status::public.publish_status
from (values
  ('Google', 4.1, 5, 2911, 'https://www.google.com/maps/search/?api=1&query=Camping%20Castell%20Montgr%C3%AD%20L%27Estartit', 5, 'published'),
  ('Tripadvisor', 3.8, 5, 1195, 'https://www.tripadvisor.es/Hotel_Review-g644326-d287393-Reviews-Camping_Castell_Montgri-L_Estartit_Costa_Brava_Province_of_Girona_Catalonia.html', 30, 'draft')
) as v(platform, rating, scale, review_count, url, sort_order, status)
where not exists (select 1 from public.review_platforms r where lower(r.platform) like lower(v.platform) || '%');

-- 2) La secció de contacte de la portada: el menú «Contacte» hi porta (abans anava al peu). Les dades (telèfon, correus, adreça)
--    surten de les dades generals; aquí només el títol, el text de sobre el títol i una frase. Va després del viatge amb la IA (60).
insert into public.sections (key, sort_order) values ('contact', 65)
on conflict (key) do nothing;

insert into public.section_translations (section_key, locale, eyebrow, title, body) values
  ('contact', 'es', 'Contacto', 'Hablemos', '¿Tienes alguna duda sobre tu estancia? Llámanos, escríbenos o ven a vernos: estaremos encantados de ayudarte.'),
  ('contact', 'ca', 'Contacte', 'Parlem', 'Tens algun dubte sobre la teva estada? Truca''ns, escriu-nos o vine a veure''ns: t''ajudarem amb molt de gust.'),
  ('contact', 'fr', 'Contact', 'Parlons-en', 'Une question sur votre séjour ? Appelez-nous, écrivez-nous ou venez nous voir : nous serons ravis de vous aider.'),
  ('contact', 'en', 'Contact', 'Get in touch', 'Any questions about your stay? Call us, write to us or come and see us: we''ll be happy to help.'),
  ('contact', 'nl', 'Contact', 'Neem contact op', 'Vragen over je verblijf? Bel ons, schrijf ons of kom langs: we helpen je graag.')
on conflict (section_key, locale) do nothing;
