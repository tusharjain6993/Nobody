#!/usr/bin/env bash
set -euo pipefail

DEPLOY_PATH="${1:-/var/www/nobody-frontend}"
NGINX_CONF_SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/nginx/nobody-frontend.conf"
NGINX_CONF_TARGET="/etc/nginx/sites-available/nobody-frontend"
NGINX_ENABLED_TARGET="/etc/nginx/sites-enabled/nobody-frontend"

sudo apt-get update
sudo apt-get install -y nginx rsync

sudo mkdir -p "${DEPLOY_PATH}/releases"
sudo chown -R "$USER":"$USER" "${DEPLOY_PATH}"

sudo cp "${NGINX_CONF_SOURCE}" "${NGINX_CONF_TARGET}"
sudo sed -i "s#/var/www/nobody-frontend#${DEPLOY_PATH}#g" "${NGINX_CONF_TARGET}"
sudo ln -sfn "${NGINX_CONF_TARGET}" "${NGINX_ENABLED_TARGET}"
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "VM ready."
echo "Deploy path: ${DEPLOY_PATH}"
echo "Nginx config: ${NGINX_CONF_TARGET}"
