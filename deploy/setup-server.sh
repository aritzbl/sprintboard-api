#!/usr/bin/env bash
# Prepares a fresh EC2 instance (Amazon Linux 2023 or Ubuntu 22/24) to run the
# production stack. Run it ONCE, as root:
#
#   sudo bash setup-server.sh
#
# It also works as the instance's "User data" at launch (paste the content).
#
# Leaves: Docker + Compose, 2 GB of swap (API + web + Postgres on a small
# instance), bounded Docker logs, /home/ec2-user ready for the normal user, and
# the service that updates the DNS on every boot (kanbio-dns, once
# deploy/update-dns.* are copied). The repository is NOT cloned: images come
# from ghcr.io and the config files are copied by hand (see DEPLOY.md).

set -euo pipefail

APP_DIR="${APP_DIR:-/home/ec2-user}"

# --- Docker -------------------------------------------------------------------
if ! command -v docker >/dev/null; then
    if [ -f /etc/os-release ] && grep -qi "amazon linux" /etc/os-release; then
        dnf install -y docker
        systemctl enable --now docker
    else
        apt-get update
        apt-get install -y ca-certificates curl
        curl -fsSL https://get.docker.com | sh
    fi
fi

# --- Compose plugin -----------------------------------------------------------
# Separate from Docker: AL2023 does not ship it, and Docker may have been
# installed before this script ran.
if ! docker compose version >/dev/null 2>&1; then
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi
docker compose version

# The default user can run docker without sudo.
for u in ec2-user ubuntu; do
    id "$u" >/dev/null 2>&1 && usermod -aG docker "$u" || true
done

# --- Swap ---------------------------------------------------------------------
if ! swapon --show | grep -q /swapfile; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

# --- Bounded Docker logs: they must not fill the disk --------------------------
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
EOF
systemctl restart docker

# --- App folder ---------------------------------------------------------------
mkdir -p "$APP_DIR/deploy" "$APP_DIR/backups"
# scp from Windows drops the executable bit.
chmod +x "$APP_DIR"/deploy/*.sh 2>/dev/null || true
owner="$(id -un ec2-user 2>/dev/null || id -un ubuntu 2>/dev/null || echo root)"
chown -R "$owner:$owner" "$APP_DIR"

# --- DNS on boot (no Elastic IP) ----------------------------------------------
# Idempotent: if the files are not copied yet, run this script again afterwards.
if [ -f "$APP_DIR/deploy/update-dns.service" ]; then
    cp "$APP_DIR/deploy/update-dns.service" /etc/systemd/system/kanbio-dns.service
    chmod +x "$APP_DIR/deploy/update-dns.sh"
    systemctl daemon-reload
    systemctl enable kanbio-dns
fi

cat <<EOF

Done. From your machine, copy the files and create the .env:

  scp compose.prod.yml $owner@IP:$APP_DIR/
  scp deploy/*.sh deploy/Caddyfile deploy/update-dns.service $owner@IP:$APP_DIR/deploy/
  ssh $owner@IP nano $APP_DIR/.env          # from .env.prod.example
  ssh $owner@IP sudo bash $APP_DIR/deploy/setup-server.sh    # again, installs kanbio-dns

And to deploy (the images in .env, :latest by default):

  ssh $owner@IP '$APP_DIR/deploy/deploy.sh'

EOF
