-- Dues opinions de cinc estrelles més, de les del web antic que eren en esborrany. Es publiquen retallades, amb «[…]» on s'ha tret
-- la part que no pertoca: a la de Roko G, una queixa d'un operador turístic (no del càmping); a la de Jasmina T, un comentari sobre
-- una mascareta. La resta és el text original. La d'Estepada no es publica: diu que no hi havia cues per la COVID, i sense aquest
-- context diria una altra cosa. Només si el text encara és l'original (si el càmping l'ha tocat des del panell, es respecta).
update public.testimonials
set quote = 'Tiene unas instalaciones espectaculares: piscinas, minigolf, restauración, actividades para todas las edades, transporte gratuito a l''Estartit. Muy buena atención por parte de la gran mayoría de los empleados. […]' || E'\n\n' || 'Muy contenta en general con la experiencia y probablemente repita.',
    status = 'published'
where author = 'Roko G' and status = 'draft' and quote like 'Tiene unas instalaciones espectaculares%Lifestyle Holidays%';

update public.testimonials
set quote = 'Todo perfectisimo como siempre que hemos estado en el càmping. […] Por lo demas todo perfecto! Como siempre des de hace muchisimos años, volveremos!!!!!!',
    status = 'published'
where author = 'Jasmina T' and status = 'draft' and quote like 'Todo perfectisimo%Mascarilla%';
