#!/usr/bin/env bash
set -Eeuo pipefail

BASE_DIR="${FORGE_BASE_DIR:-/opt/forge-private-isolated}"
SOURCE_DIR="$BASE_DIR/current/scripts/systemd"

test "${EUID:-$(id -u)}" = '0' || { printf 'Forge candidate operations installer must run as root\n' >&2; exit 1; }
for command_name in id install systemctl systemd-analyze; do
  command -v "$command_name" >/dev/null 2>&1 || { printf 'Missing required command: %s\n' "$command_name" >&2; exit 1; }
done
install -o root -g root -m 0700 -d "$BASE_DIR/backups"
systemd-analyze verify \
  "$SOURCE_DIR/forge-candidate-backup.service" \
  "$SOURCE_DIR/forge-candidate-backup.timer" \
  "$SOURCE_DIR/forge-candidate-monitor.service" \
  "$SOURCE_DIR/forge-candidate-monitor.timer"
for unit in forge-candidate-backup.service forge-candidate-backup.timer forge-candidate-monitor.service forge-candidate-monitor.timer; do
  test -f "$SOURCE_DIR/$unit" || { printf 'Missing unit: %s\n' "$SOURCE_DIR/$unit" >&2; exit 1; }
  install -o root -g root -m 0644 "$SOURCE_DIR/$unit" "/etc/systemd/system/$unit"
done

systemctl daemon-reload
systemctl start forge-candidate-backup.service
systemctl enable --now forge-candidate-backup.timer
systemctl start forge-candidate-monitor.service
systemctl enable --now forge-candidate-monitor.timer
systemctl is-active forge-candidate-backup.timer forge-candidate-monitor.timer
systemctl is-enabled forge-candidate-backup.timer forge-candidate-monitor.timer
printf 'Forge candidate backup and monitor timers installed and verified\n'
