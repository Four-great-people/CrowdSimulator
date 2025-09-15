#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/install_mongodb_ubuntu.sh
#   bash scripts/install_mongodb_ubuntu.sh --remove   # full remove 

REMOVE="${1:-}"

if [[ "${REMOVE}" == "--remove" ]]; then
  echo "🧹 Removing MongoDB and repo…"
  sudo systemctl stop mongod || true
  sudo apt purge -y mongodb-org mongodb-mongosh || true
  sudo rm -f /etc/apt/sources.list.d/mongodb-org-7.0.list
  sudo rm -f /usr/share/keyrings/mongodb-server-7.0.gpg
  sudo apt autoremove -y
  echo "Removed MongoDB 7.0 and repo."
  exit 0
fi

if ! command -v lsb_release >/dev/null 2>&1; then
  echo "Installing lsb-release…"
  sudo apt update
  sudo apt install -y lsb-release
fi

CODENAME="$(lsb_release -cs)"
ARCH="$(dpkg --print-architecture)"

REPO_CODENAME="$CODENAME"
if [[ "$CODENAME" == "noble" ]]; then
  echo "  Ubuntu 24.04 (noble) detected — using jammy repo for MongoDB 7.0."
  REPO_CODENAME="jammy"
fi

echo "  Ubuntu codename: $CODENAME  (repo: $REPO_CODENAME) | arch: $ARCH"

sudo apt update
sudo apt install -y gnupg curl ca-certificates

sudo install -d -m 0755 /usr/share/keyrings
curl -fsSL https://pgp.mongodb.com/server-7.0.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

echo "deb [arch=${ARCH} signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu ${REPO_CODENAME}/mongodb-org/7.0 multiverse" \
  | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list >/dev/null

sudo apt update
sudo apt install -y mongodb-org

sudo systemctl enable --now mongod

if ! command -v mongosh >/dev/null 2>&1; then
  sudo apt install -y mongodb-mongosh
fi

mongosh --eval 'db.adminCommand({ ping: 1 })' || {
  echo " mongod is not responding. Check: sudo systemctl status mongod"
  exit 1
}

echo " MongoDB 7.0 installed and running."
echo "   Service: sudo systemctl status mongod"

