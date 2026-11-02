-- Les fotos de la benvinguda: la primera és la que s'obre amb el scroll i les altres, les del voltant. El client les canvia des del panell.
-- En una base nova encara no hi ha fotos: la secció fa servir la seva foto de sempre fins que se n'hi posin.
insert into public.section_media (section_key, media_id, sort_order)
select 'welcome', m.id, picked.position
from (
  values
    ('services/img-5531-66a9f0fcf38d9110442218.jpg', 1),
    ('services/img-3675-66a9f0957c466293821970.jpg', 2),
    ('banners/banner-gastronomia-65ef3805d2b87391045359.jpg', 3),
    ('banners/banner-entorn-65ef39c3d30fe788678728.jpg', 4),
    ('banners/img-8754-6911cea73e918982998744.jpg', 5),
    ('banners/2g8a2072-copia-669e2926dc5b9382856148.jpg', 6),
    ('site/animacion.jpg', 7)
) as picked (path, position)
join public.media m on m.path = picked.path
on conflict (section_key, media_id) do nothing;
