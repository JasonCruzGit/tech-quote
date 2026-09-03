# Deploy to Hostinger (Node.js Web Apps — no VPS)

This app is **Next.js + SQLite**. Deploy it as a **Node.js web app** in hPanel — not as static files in `public_html`.

You do **not** need an `index.html` upload like Vite/React SPAs. Hostinger runs `npm run build` then `npm start` and proxies your domain to that process.

## Requirements

- Hostinger plan with **Node.js Web Apps** (Business or Cloud)
- GitHub repo: https://github.com/JasonCruzGit/tech-quote

## Steps in hPanel

1. Go to **Websites → Add Website → Node.js web app**
2. Choose **Import Git Repository**
3. Select `JasonCruzGit/tech-quote`, branch `main`
4. Use these settings:

| Setting | Value |
|---|---|
| Framework | Next.js |
| Node.js version | **20** (or 22) |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Start command | `npm run start -- -p $PORT` |
| Entry file | *(leave empty for Next.js)* |
| Output directory | *(leave empty / `.next`)* |

5. Click **Deploy**
6. Wait until status is **Running**
7. Open your domain

## After deploy

- SQLite lives in `data/techcentrix.db` on the server disk
- Document uploads go under `data/uploads/`
- Restart from the app dashboard if the process hangs

## Local check before deploy

```bash
npm ci
npm run build
PORT=3000 npm start
```

Open http://localhost:3000

## Notes

- Do **not** upload a Vite-style `public_html/index.html` for this project — that only works for static SPAs.
- If `better-sqlite3` fails to install on Hostinger, open a Hostinger ticket and confirm native module builds (node-gyp) are allowed on your Node.js plan.
- Pushing to `main` can auto-redeploy if GitHub auto-deploy is enabled.
