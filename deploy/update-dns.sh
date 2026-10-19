#!/usr/bin/env bash
# Points the A record of SITE_ADDRESS (Cloudflare) at the instance's current
# public IP. Replaces an Elastic IP: the instance uses its automatic public
# IPv4, which changes on every stop/start but costs nothing while stopped, and
# this script fixes the DNS on boot.
#
# systemd runs it on every boot (deploy/update-dns.service, installed by
# setup-server.sh). It can also be run by hand.
#
# Needs in /home/ec2-user/.env:
#   SITE_ADDRESS   full name, e.g. kanbio.yourdomain.com
#   CF_ZONE_ID     Cloudflare -> the domain -> Overview -> "Zone ID"
#   CF_API_TOKEN   token with Zone/DNS/Edit + Zone/Zone/Read on that zone only
#
# The record stays proxied (orange cloud): Caddy gets its certificate through
# DNS-01, so it needs no direct traffic, and the instance's IP stays hidden.

set -euo pipefail

APP_DIR="${APP_DIR:-/home/ec2-user}"

# No `source .env`: bash would execute it, and a value with spaces or `<>`
# (MAIL_FROM="Kanbio <x@y>") breaks. Read only the keys we need, literally,
# without quotes or \r.
envval() {
    grep -m1 "^$1=" "$APP_DIR/.env" | cut -d= -f2- | sed -e 's/\r$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"
}
SITE_ADDRESS=$(envval SITE_ADDRESS)
CF_ZONE_ID=$(envval CF_ZONE_ID)
CF_API_TOKEN=$(envval CF_API_TOKEN)

: "${SITE_ADDRESS:?missing SITE_ADDRESS in .env}"
: "${CF_ZONE_ID:?missing CF_ZONE_ID in .env}"
: "${CF_API_TOKEN:?missing CF_API_TOKEN in .env}"

API="https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records"
auth=(-H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json")

# IMDSv2: the public IP as the internet sees it.
token=$(curl -sS -X PUT "http://169.254.169.254/latest/api/token" \
        -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
ip=$(curl -sS -H "X-aws-ec2-metadata-token: $token" \
        "http://169.254.169.254/latest/meta-data/public-ipv4")
[ -n "$ip" ] || { echo "no public IP" >&2; exit 1; }

body="{\"type\":\"A\",\"name\":\"$SITE_ADDRESS\",\"content\":\"$ip\",\"ttl\":60,\"proxied\":true}"

# Does the record exist? If so, PUT on its id; otherwise POST.
existing=$(curl -sS "${auth[@]}" "$API?type=A&name=$SITE_ADDRESS")
record_id=$(echo "$existing" | python3 -c 'import sys,json; r=json.load(sys.stdin)["result"]; print(r[0]["id"] if r else "")')
current=$(echo "$existing" | python3 -c 'import sys,json; r=json.load(sys.stdin)["result"]; print(r[0]["content"] if r else "")')
proxied=$(echo "$existing" | python3 -c 'import sys,json; r=json.load(sys.stdin)["result"]; print(str(r[0]["proxied"]).lower() if r else "")')

if [ "$current" = "$ip" ] && [ "$proxied" = "true" ]; then
    echo "$SITE_ADDRESS already points to $ip (proxied)"
    exit 0
fi

if [ -n "$record_id" ]; then
    resp=$(curl -sS -X PUT "${auth[@]}" "$API/$record_id" --data "$body")
else
    resp=$(curl -sS -X POST "${auth[@]}" "$API" --data "$body")
fi

echo "$resp" | python3 -c 'import sys,json; r=json.load(sys.stdin); sys.exit(0 if r["success"] else 1)' \
    || { echo "Cloudflare rejected the change: $resp" >&2; exit 1; }

echo "$SITE_ADDRESS -> $ip"
