# Deploy on Hostinger VPS (Node.js)

This app is **Next.js + SQLite**. It must run as a Node.js process — not as static files in `public_html`.

## 1. Server requirements

On the VPS (SSH):

```bash
# Node 20+ (LTS)
node -v

# Native build tools (needed by better-sqlite3)
sudo apt update
sudo apt install -y build-essential python3

# Process manager
sudo npm i -g pm2
```

## 2. Clone and install

```bash
cd /home/YOUR_USER   # or your preferred app directory
git clone https://github.com/JasonCruzGit/tech-quote.git
cd tech-quote
npm ci
```

If you already pushed your local `data/techcentrix.db`, it will be included.  
Keep that folder writable so the app can update quotations:

```bash
chmod -R u+rwX data
```

## 3. Build and start

```bash
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # follow the command it prints
```

App listens on **port 3000** by default (`PORT` in `ecosystem.config.cjs`).

Useful PM2 commands:

```bash
pm2 status
pm2 logs tech-quote
pm2 restart tech-quote
```

## 4. Point your domain at the app

### Option A — reverse proxy (recommended)

In Hostinger / Nginx, proxy your domain to `http://127.0.0.1:3000`.

Example Nginx location:

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then reload Nginx / apply SSL (Let's Encrypt) in hPanel.

### Option B — Hostinger Node.js app panel

If you use Hostinger's Node.js selector:

1. Set **application root** to the `tech-quote` folder
2. Set **application startup file** / run command to use PM2 or:
   - Build command: `npm run build`
   - Start command: `npm start`
3. Set port to match what Hostinger assigns (update `PORT` in `ecosystem.config.cjs` if needed)

## 5. Updates after code changes

```bash
cd ~/tech-quote
git pull
npm ci
npm run build
pm2 restart tech-quote
```

## Notes

- Do **not** upload only an `index.html` to `public_html` — APIs and SQLite will not work.
- Do **not** run multiple PM2 instances of this app; SQLite expects a single writer.
- Document uploads are stored under `data/uploads/` — back this folder up with the `.db` file.
- Backup regularly:

```bash
cp data/techcentrix.db data/techcentrix.db.bak-$(date +%F)
```
