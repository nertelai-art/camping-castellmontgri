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
pnpm dev
```

`pnpm install` activa el hook de pre-push (`.githooks/pre-push`): typecheck,
lint, tests i `gitleaks`.

| Ordre | Què fa |
|---|---|
| `pnpm dev` | Servidor de desenvolupament |
| `pnpm check` | typecheck + lint + tests |
| `pnpm build` | Build de producció (el que fa la CI) |

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
