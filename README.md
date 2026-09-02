# DevMemory Vault

**A local, encrypted memory vault for AI-assisted development.**

DevMemory records the developer prompt and AI response that shaped a project, encrypts the record in the browser, stores it in IndexedDB, and makes it recallable later without loading an entire chat transcript into context.

## Why it exists

AI coding sessions are full of decisions, fixes, and explanations that disappear when a session ends or a developer switches tools. DevMemory keeps the useful exchange close to the developer and tied to a project.

## Included in this MVP

- Browser-only vault unlock with a user passphrase.
- AES-GCM encryption for every stored memory record.
- PBKDF2 key derivation; the passphrase is never stored.
- IndexedDB persistence; no backend, account, or analytics dependency.
- Explicit capture of developer prompt and AI response.
- Project, source, model, tag, and timestamp metadata.
- Hybrid-style local recall: exact token matching plus deterministic vector-style similarity.
- Record detail view with original prompt and response evidence.
- Encrypted vault export/import.
- Per-record deletion and full-vault clearing.
- GitHub Pages, Netlify, and Vercel-compatible static deployment.

## Privacy boundary

This project does **not** keylog, screen-record, or silently capture input. A developer explicitly imports a vault or clicks **Capture exchange**. Secrets should never be saved into memory; the app should eventually add a pre-index redaction pass for API keys and tokens.

## Architecture

```text
Explicit capture / encrypted import
              ↓
     AES-GCM encrypted IndexedDB
              ↓
   Local exact + vector-style recall
              ↓
    Evidence-backed memory detail
```

The current MVP uses a deterministic hashed-token vectorizer so it can run offline with no model download. It is intentionally a replaceable projection, not the source of truth. A future adapter can add a local embedding model while preserving the encrypted record store and provenance metadata.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the local HTTPS/preview URL, create a passphrase of at least eight characters, and use the seeded sample records to test recall. Sample records can be deleted from the vault.

## Build

```bash
pnpm check
pnpm build
```

## Deploy

- **GitHub Pages:** push to the `main` branch. The included workflow builds and publishes `dist/public`.
- **Netlify:** connect the repository; `netlify.toml` sets the build command and publish directory.
- **Vercel:** import the repository; `vercel.json` sets the Vite build output.

GitHub Pages is a public website, but the vault data remains in each visitor’s own browser. Do not share your passphrase or exported vault file.

## License

MIT. See [LICENSE](LICENSE).
