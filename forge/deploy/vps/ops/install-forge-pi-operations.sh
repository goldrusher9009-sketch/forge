#!/usr/bin/env bash
# Install the forge-pi backup + monitor timers. Run as root on the VPS from /opt/forge-pi.
set -Eeuo pipefail
BASE_DIR="${FORGE_BASE_DIR:-/opt/forge-pi}"
SOURCE_DIR="$BASE_DIR/deploy/vps/ops"
test "${EUID:-$(id -u)}" = '0' || { echo 'must run as root' >&2; exit 1; }
install -o root -g root -m 0700 -d "$BASE_DIR/backups"
chmod 0755 "$SOURCE_DIR"/forge-pi-backup.sh "$SOURCE_DIR"/forge-pi-monitor.sh
for unit in forge-pi-backup.service forge-pi-backup.timer forge-pi-monitor.service forge-pi-monitor.timer; do
  install -o root -g root -m 0644 "$SOURCE_DIR/$unit" "/etc/systemd/system/$unit"
done
systemctl daemon-reload
systemctl start forge-pi-backup.service
systemctl enable --now forge-pi-backup.timer
systemctl start forge-pi-monitor.service || true
systemctl enable --now forge-pi-monitor.timer
systemctl is-active forge-pi-backup.timer forge-pi-monitor.timer
systemctl is-enabled forge-pi-backup.timer forge-pi-monitor.timer
