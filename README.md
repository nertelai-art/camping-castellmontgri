# Natura Village Castell Montgrí

Web nova del Càmping Castell Montgrí (L'Estartit, Costa Brava): landing animada
en 5 idiomes i panell d'administració del contingut.

- Pla i decisions: [ROADMAP.md](ROADMAP.md)
- Convencions per treballar-hi: [CLAUDE.md](CLAUDE.md)

## Posar-s'hi

Cal Node 22 i pnpm 10 (la versió exacta surt de `packageManager`).

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm exec supabase start
pnpm db:reset
pnpm seed
pnpm dev
```

`supabase start` necessita Docker i imprimeix les claus locals per posar a `.env.local`.
El seed llegeix `reference/images/`, que no és al git: cal haver-lo generat abans (vegeu `reference/`).

`pnpm install` activa el hook de pre-push (`.githooks/pre-push`): typecheck,
lint, tests i `gitleaks`.

| Ordre | Què fa |
|---|---|
| `pnpm dev` | Servidor de desenvolupament |
| `pnpm check` | typecheck + lint + tests |
| `pnpm build` | Build de producció (el que fa la CI) |
| `pnpm db:reset` | Refà la base local amb les migracions |
| `pnpm db:test` | Proves RLS (pgTAP) contra la base local |
| `pnpm db:types` | Regenera els tipus de TypeScript a partir de l'esquema |
| `pnpm seed [fitxer .env]` | Carrega el contingut del web antic (per defecte, `.env.local`) |

## Problemes coneguts

**`ERR_SWC_NATIVE_CACHE` en arrencar o fer typecheck (Windows).** El plugin de
next-intl carrega `@swc/core`, que copia el seu binari a una caché i rebutja
`%LOCALAPPDATA%\swc` si els permisos de la carpeta deixen que una altra
aplicació el substitueixi. Solució local: a `.env.local`,

```
SWC_NATIVE_BINDING_CACHE=C:/Users/<usuari>/.cache/swc
```

Ha de ser un camí **curt**: dins del projecte el nom del fitxer de bloqueig
passa de 260 caràcters i falla.
