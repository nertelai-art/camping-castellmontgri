-- La portada, des del panell: els blocs que eren fixos al codi (les portes a les pàgines, com arribar-hi, el viatge amb la IA i les opinions)
-- passen a ser seccions, per poder-ne editar el títol, amagar-los i canviar-los d'ordre. L'ordre de la portada és el `sort_order` de les seves
-- seccions; les que tenen pàgina pròpia o són legals queden al darrere, fora de la portada.
insert into public.sections (key, sort_order) values
  ('explore', 30),
  ('directions', 50),
  ('trip', 60),
  ('testimonials', 70)
on conflict (key) do nothing;

update public.sections set sort_order = case key
  when 'welcome' then 10
  when 'accommodation' then 20
  when 'map' then 40
  when 'services' then 110
  when 'entertainment' then 120
  when 'gastronomy' then 130
  when 'surroundings' then 140
  when 'gallery' then 150
  when 'accommodation-intro' then 160
end
where key in ('welcome', 'accommodation', 'map', 'services', 'entertainment', 'gastronomy', 'surroundings', 'gallery', 'accommodation-intro');

insert into public.section_translations (section_key, locale, title, body) values
  ('explore', 'es', 'Descubre el camping', null),
  ('explore', 'ca', 'Descobreix el càmping', null),
  ('explore', 'fr', 'Découvrez le camping', null),
  ('explore', 'en', 'Discover the campsite', null),
  ('explore', 'nl', 'Ontdek de camping', null),
  ('directions', 'es', 'Cómo llegar', null),
  ('directions', 'ca', 'Com arribar-hi', null),
  ('directions', 'fr', 'Comment venir', null),
  ('directions', 'en', 'How to get here', null),
  ('directions', 'nl', 'Zo kom je hier', null),
  ('trip', 'es', 'Tu viaje, con la IA', 'Elige los días y el tipo de viaje, y llévate este texto a tu asistente de IA favorito. En segundos tendrás un plan a tu medida.'),
  ('trip', 'ca', 'El teu viatge, amb la IA', 'Tria els dies i el tipus de viatge, i emporta''t aquest text al teu assistent d''IA preferit. En uns segons tindràs un pla a mida.'),
  ('trip', 'fr', 'Votre voyage, avec l’IA', 'Choisissez la durée et le type de voyage, puis emportez ce texte dans votre assistant d’IA préféré. En quelques secondes, vous aurez un programme sur mesure.'),
  ('trip', 'en', 'Your trip, with AI', 'Choose the length and type of trip, and take this text to your favourite AI assistant. In seconds you’ll have a plan made for you.'),
  ('trip', 'nl', 'Jouw reis, met AI', 'Kies de duur en het soort reis, en neem deze tekst mee naar je favoriete AI-assistent. Binnen enkele seconden heb je een plan op maat.'),
  ('testimonials', 'es', 'Qué dicen de nosotros', null),
  ('testimonials', 'ca', 'Què diuen de nosaltres', null),
  ('testimonials', 'fr', 'Ce qu''ils disent de nous', null),
  ('testimonials', 'en', 'What our guests say', null),
  ('testimonials', 'nl', 'Wat onze gasten zeggen', null)
on conflict (section_key, locale) do nothing;
