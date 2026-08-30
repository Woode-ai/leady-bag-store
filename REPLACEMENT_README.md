# leadybag — Full Replacement Package

This package is a merged replacement of the original project with the audited/security-fixed files overlaid.

## Intentionally excluded
- `.env.local` / `.env*` secrets
- `node_modules/`
- `.next/`
- `.git/`

Keep your existing `.env.local` separately and copy it into this project after extraction.

## Install
```bash
npm ci
npm run build
npm run dev
```
