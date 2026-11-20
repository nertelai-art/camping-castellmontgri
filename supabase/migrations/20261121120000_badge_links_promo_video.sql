-- 1) Les insígnies del peu (ADAC, Tripadvisor, Zoover…) poden portar un enllaç, com al web antic. Va a la imatge mateixa (`media`):
--    el peu les llegeix de la carpeta `accreditations`. Els enllaços de partida són els del web antic; el de Tripadvisor porta a les
--    opinions (el web antic portava a escriure'n una). ANWB, Erkend i la Generalitat no en tenien.
alter table public.media add column link_url text check (link_url is null or link_url ~ '^https://');

update public.media set link_url = v.url
from (values
  ('accreditations/adac.png', 'https://www.pincamp.de/campingplaetze/camping-castell-montgri'),
  ('accreditations/trip_advisor.png', 'https://www.tripadvisor.es/Hotel_Review-g644326-d287393-Reviews-Camping_Castell_Montgri-L_Estartit_Costa_Brava_Province_of_Girona_Catalonia.html'),
  ('accreditations/zoover.png', 'https://www.zoover.nl/spanje/catalonie-costa-brava-en-costa-dorada/lestartit/castell-montgri-glamping/camping')
) as v(path, url)
where media.path = v.path and media.link_url is null;

-- 2) El vídeo promocional (el botó «Veure el vídeo» del hero). És el nom dels fitxers a Storage, a `media/video/`:
--    `<nom>.mp4` (el vídeo sencer), `<nom>-preview.mp4` (uns segons en bucle per al botó) i `<nom>-poster.jpg`. Buit, no surt cap botó.
alter table public.site_settings add column promo_video text check (promo_video is null or promo_video ~ '^[a-z0-9-]+$');

update public.site_settings set promo_video = 'promo-es' where promo_video is null;
