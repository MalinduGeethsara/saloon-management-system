# Deploying MR POLAA to a DigitalOcean droplet

Target: one Ubuntu droplet running Next.js (PM2) + MySQL, with the existing Cloudflare Tunnel
(`mr-polaa`) serving https://mr-polaa.com. No inbound web ports are opened: Cloudflare reaches the
app through the tunnel.

## 0. Start these first (they have waiting time)

| Item | Why | Where |
|---|---|---|
| Resend domain verification | Without a verified sender, OTP/confirmation emails only reach your own address | Resend dashboard -> Domains -> add `mr-polaa.com`, add the DNS records in Cloudflare, then set `RESEND_FROM_EMAIL` |
| PayHere live account | `PAYHERE_MODE=sandbox` means real cards are never charged | PayHere -> Settings -> Domains: add `mr-polaa.com`; use the **live** merchant id + secret. If approval isn't done, hide online payment and take payment in the shop |
| notify.lk sender id | `NotifyDEMO` is a demo sender | notify.lk -> Sender IDs. If not approved yet, launch with email OTP only |
| Google OAuth | Login with Google fails for real users otherwise | Google Cloud Console -> Credentials: add redirect URI `https://mr-polaa.com/api/auth/google/callback`; OAuth consent screen -> **Publish app** (In production) |
| Droplet | Provisioning + updates take time | see section 1 |

## 1. Droplet

- Ubuntu 24.04 LTS, at least **2 GB RAM** (`next build` needs it), region closest to Sri Lanka (Singapore/Bangalore).
- Add your SSH key at creation; disable password login afterwards.
- Enable DigitalOcean **Backups** (weekly snapshots) as a second safety net.

```bash
# as root, once
adduser deploy && usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && systemctl restart ssh

ufw default deny incoming && ufw allow OpenSSH && ufw --force enable   # traffic arrives via the tunnel, not 80/443

# The app uses the server clock for attendance and shop opening hours: keep it on Sri Lanka time
timedatectl set-timezone Asia/Colombo

# 2 GB swap so builds don't get OOM-killed
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 2. Install the stack (as `deploy`)

```bash
# Node 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs git mysql-server
sudo npm i -g pm2

# cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

## 3. MySQL (local only, dedicated user)

MySQL listens on 127.0.0.1 by default on Ubuntu; leave it that way.

```sql
-- sudo mysql
CREATE DATABASE saloon_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;  -- _ci: searches are case-insensitive
CREATE USER 'polaa_app'@'localhost' IDENTIFIED BY 'LONG_RANDOM_PASSWORD';
GRANT ALL PRIVILEGES ON saloon_management.* TO 'polaa_app'@'localhost';
CREATE USER 'backup'@'localhost' IDENTIFIED BY 'ANOTHER_LONG_RANDOM_PASSWORD';
GRANT SELECT, SHOW VIEW, TRIGGER, LOCK TABLES ON saloon_management.* TO 'backup'@'localhost';
```

MySQL 8 defaults are sized for a big server. On a 2 GB droplet that also runs Node, cap it (measured: the
app + database together stay well under 1 GB at 100 simultaneous users with this):

```ini
# /etc/mysql/mysql.conf.d/zz-polaa.cnf   then: sudo systemctl restart mysql
[mysqld]
innodb_buffer_pool_size = 256M
max_connections         = 60
performance_schema      = OFF
skip-name-resolve
```

## 4. The app

Layout on the droplet (this is what the automatic deploy in section 8 uses too):

```
/srv/mr-polaa/repo         git clone of the private repo (read-only deploy key)
/srv/mr-polaa/shared/.env  production secrets, never in git
/srv/mr-polaa/releases/    one folder per deploy (source + node_modules + .next)
/srv/mr-polaa/current      symlink to the live release; PM2 runs from here
/srv/mr-polaa/deploy.sh    the deploy script (kept in step with the repo by every deploy)
```

```bash
sudo mkdir -p /srv/mr-polaa/{shared,releases} && sudo chown -R deploy:deploy /srv/mr-polaa
# a read-only deploy key: ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N "" ; add ~/.ssh/github_deploy.pub
# under GitHub repo > Settings > Deploy keys (read access only), then point ssh at it in ~/.ssh/config
git clone git@github.com:<you>/<repo>.git /srv/mr-polaa/repo
cp /srv/mr-polaa/repo/.env.example /srv/mr-polaa/shared/.env && nano /srv/mr-polaa/shared/.env   # see the table below
cp /srv/mr-polaa/repo/deploy/deploy.sh /srv/mr-polaa/deploy.sh && chmod +x /srv/mr-polaa/deploy.sh
```

`shared/.env` (never committed):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `mysql://polaa_app:PASSWORD@127.0.0.1:3306/saloon_management` |
| `SESSION_SECRET` | new random value: `openssl rand -hex 32` (logs everyone out once - fine) |
| `NEXT_PUBLIC_APP_URL` | `https://mr-polaa.com` (**must be set before `npm run build`**, it is baked into the bundle; the app refuses to start a PayHere checkout without it in production) |
| `PAYHERE_MODE` / `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` | `live` + live credentials |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | key + `MR POLAA <bookings@mr-polaa.com>` |
| `NOTIFYLK_*` | live user id / key / approved sender id |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | as in Google Cloud |
| `NEXT_PUBLIC_CLOUDINARY_*`, `CLOUDINARY_API_SECRET` | as today |
| `FINGERPRINT_DEVICE_KEY` | new random value; put the same key in the attendance device |
| `NODE_ENV` | **do not set** (PM2 sets `production`; the secure-cookie flag depends on it) |

```bash
/srv/mr-polaa/deploy.sh main    # npm ci -> prisma db push -> build -> start under PM2 -> health check
pm2 startup                     # run the command it prints, so the site starts after a reboot
cd /srv/mr-polaa/current
# put OWNER_EMAIL / OWNER_NAME / OWNER_PASSWORD (and ADMIN_* if you want an admin) in .env, then:
node --env-file=.env prisma/create-owner.js
# then delete the *_PASSWORD lines from .env (the database keeps only a hash). Re-running it with another
# OWNER_* / ADMIN_* set adds one more account; an email that already exists is left alone.
# Do NOT run prisma/seed.js in production: it creates demo accounts that share one password.
curl -I http://127.0.0.1:3000/                                      # expect 200

# Check the database is InnoDB (transactions + foreign keys); MyISAM would silently lose both:
sudo mysql -e "SELECT DISTINCT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA='saloon_management'"   # expect only InnoDB
```

Then sign in as the owner and enter the real branches, services, products and staff in the UI.

## 5. Cloudflare Tunnel (cut over)

Copy the existing tunnel to the droplet so DNS does not change:

1. On the Windows PC: `%USERPROFILE%\.cloudflared\` holds `config.yml` and `<tunnel-id>.json`.
2. On the droplet: `sudo mkdir -p /etc/cloudflared`, copy both files there, and make `config.yml` say:
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: /etc/cloudflared/<tunnel-id>.json
   ingress:
     - hostname: mr-polaa.com
       service: http://localhost:3000
     - hostname: www.mr-polaa.com
       service: http://localhost:3000
     - service: http_status:404
   ```
3. `sudo cloudflared service install && sudo systemctl enable --now cloudflared`
4. **Stop `cloudflared` on the Windows PC** (and `next start` there). Two connectors on one tunnel share
   traffic, so visitors would randomly hit the old site and its old database.
5. Pick one public host (apex or `www`) and redirect the other in Cloudflare - session cookies are host-only.

## 6. Backups

```bash
sudo install -m 600 /dev/null /root/.mr-polaa-backup.cnf
printf '[client]\nuser=backup\npassword=ANOTHER_LONG_RANDOM_PASSWORD\n' | sudo tee /root/.mr-polaa-backup.cnf >/dev/null
sudo chmod +x /srv/mr-polaa/current/deploy/backup-db.sh && sudo /srv/mr-polaa/current/deploy/backup-db.sh    # run once by hand
sudo crontab -e     # add:  30 2 * * * /srv/mr-polaa/current/deploy/backup-db.sh >> /var/log/mr-polaa-backup.log 2>&1
```

Copy dumps off the droplet as well (rclone to Google Drive/S3/Spaces), and do **one test restore** into a scratch
database (`gunzip -c file.sql.gz | mysql scratch_db`) before you rely on them.

## 7. Smoke test on the live domain

- [ ] `/` loads; on a phone the video and the services rail show on the first screen
- [ ] Owner sign-in at `/staff-login`; Expenses page loads; add an expense and see the totals change
- [ ] Customer registration: OTP email arrives at an address that is not yours
- [ ] Google sign-in works; `https://mr-polaa.com/api/auth/google/callback?state=//evil.com` does **not** redirect off-site
- [ ] Booking -> PayHere -> return page confirms (use a small real payment, then refund it)
- [ ] Wrong password 6 times in a row is rate-limited
- [ ] `pm2 status` shows `online`; `sudo reboot` and confirm it comes back by itself

## 8. Updating later

**Automatic (recommended).** Every push to `main` runs `.github/workflows/ci-cd.yml`: type-check, lint, a clean
production build, and the QA suites (functional, security, concurrency, integrity) against a real MySQL 8. Only if
all of that passes does the `deploy` job SSH into the droplet and run `deploy.sh <commit>`, which builds the new
version in its **own folder** while the live site keeps serving, then switches the `current` symlink, reloads PM2 and
health-checks `http://127.0.0.1:3000/`. If the check fails it switches back to the previous release by itself. The last 3
releases are kept, so a manual rollback is `ln -sfn /srv/mr-polaa/releases/<older> /srv/mr-polaa/current && pm2 reload mr-polaa`.

One-time GitHub setup (repo > Settings > Secrets and variables > Actions), plus an Environment named `production`
(optionally with a required reviewer if you want a manual approval before each deploy):

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | the droplet's IP |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | private key of a key pair whose **public** half is in `/home/deploy/.ssh/authorized_keys` (make a separate one, e.g. `ssh-keygen -t ed25519 -f gha_deploy`) |
| `DEPLOY_KNOWN_HOSTS` | optional but better: output of `ssh-keyscan -t ed25519 <droplet ip>` (pins the server identity) |

Because `ufw` only allows port 22 in, GitHub's runners reach the droplet over SSH with that key only (password login is off).

**Manual (fallback).** `ssh deploy@<droplet> /srv/mr-polaa/deploy.sh main`.

Schema changes: `deploy.sh` runs `prisma db push` **without** `--accept-data-loss`, so an edit that would drop a
column/table with data makes the deploy stop before anything is switched. That is deliberate; handle such a change by hand.

## 9. Rollback

Keep the Windows PC setup untouched until the smoke test passes. To roll back: stop `cloudflared` on the droplet
and start it again on the PC. Database changes made on the droplet after cutover will not exist on the PC.
