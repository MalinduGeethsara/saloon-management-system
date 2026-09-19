#!/usr/bin/env bash
# Nightly MySQL backup for the droplet. Install with:  sudo crontab -e
#   30 2 * * * /srv/mr-polaa/current/deploy/backup-db.sh >> /var/log/mr-polaa-backup.log 2>&1
#
# Credentials come from a root-only option file, never from this script or the shell history:
#   sudo install -m 600 /dev/null /root/.mr-polaa-backup.cnf
#   printf '[client]\nuser=backup\npassword=CHANGE_ME\n' | sudo tee /root/.mr-polaa-backup.cnf
# (create the 'backup' MySQL user with SELECT, SHOW VIEW, TRIGGER, LOCK TABLES on the app database)
set -euo pipefail

DB_NAME="${DB_NAME:-saloon_management}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/mr-polaa}"
KEEP_DAYS="${KEEP_DAYS:-14}"
OPTION_FILE="${OPTION_FILE:-/root/.mr-polaa-backup.cnf}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

stamp="$(date +%Y%m%d-%H%M%S)"
target="$BACKUP_DIR/${DB_NAME}-${stamp}.sql.gz"

# --single-transaction = consistent snapshot without locking the live site
mysqldump --defaults-extra-file="$OPTION_FILE" --single-transaction --routines --no-tablespaces "$DB_NAME" | gzip > "$target"

# A truncated dump is worse than none: verify the gzip stream before trusting it
gzip -t "$target"

find "$BACKUP_DIR" -name "${DB_NAME}-*.sql.gz" -mtime +"$KEEP_DAYS" -delete
echo "$(date -Is) backup ok: $target ($(du -h "$target" | cut -f1))"

# Copy off the droplet too (a backup on the same disk dies with the disk), e.g.:
#   rclone copy "$target" remote:mr-polaa-backups/
