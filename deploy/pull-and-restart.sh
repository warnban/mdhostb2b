#!/bin/bash
set -euo pipefail
cd /var/www/mdhostb2b
git pull origin main
npm ci --omit=dev
sudo systemctl restart mdhost-b2b
sudo systemctl status mdhost-b2b --no-pager
