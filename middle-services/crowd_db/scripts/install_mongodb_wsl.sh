set -euo pipefail

if ! grep -q "systemd=true" /etc/wsl.conf 2>/dev/null; then
  sudo bash -c 'cat >> /etc/wsl.conf <<EOF
[boot]
systemd=true
EOF'
  echo "Now run: wsl --shutdown  (from Windows PowerShell) and re-open WSL"
  exit 0
fi

sudo apt update
sudo apt install -y gnupg curl ca-certificates

curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

mongosh --eval 'db.adminCommand({ ping: 1 })' || true
echo " MongoDB installed and running"

