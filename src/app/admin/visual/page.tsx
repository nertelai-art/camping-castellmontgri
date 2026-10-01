import Link from "next/link";

export default function VisualHome() {
  return (
    <div className="pb-8 text-lg">
      <h1 className="font-display text-3xl text-olive">Clica el que vulguis canviar</h1>
      <p className="mt-3 text-muted">
        A l&apos;esquerra hi ha la web tal com la veuen els visitants. Passa-hi el ratolí: el que es pot editar es marca amb una vora taronja. Clica-ho i aquí s&apos;obriran els
        seus textos i fotos.
      </p>
      <ul className="mt-5 grid gap-3 text-base text-muted">
        <li>
          <strong className="text-ink">Edita / Navega.</strong> En «Navega» la web es comporta com per a un visitant: pots obrir fitxes i menús.
        </li>
        <li>
          <strong className="text-ink">Ordinador / Mòbil.</strong> Per veure com queda en una pantalla petita.
        </li>
        <li>
          <strong className="text-ink">Idioma.</strong> Tria en quin idioma vols veure la web mentre edites.
        </li>
      </ul>
      <p className="mt-6 text-base text-muted">
        El que no es veu a la portada (esborranys, punts del mapa, registre de canvis) continua a{" "}
        <Link href="/admin" className="font-bold text-terra hover:underline">
          les llistes del panell
        </Link>
        .
      </p>
    </div>
  );
}
