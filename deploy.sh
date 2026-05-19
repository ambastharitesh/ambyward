#!/usr/bin/env bash
# RewardLens EC2 deploy script.
# Run on the EC2 server. Pulls latest code, rebuilds frontend, restarts backend.

set -e
cd ~/ambyward

echo "▶ Pulling latest from main…"
git fetch origin main
git reset --hard origin/main

echo "▶ Building frontend…"
npm install --silent
npm run build

echo "▶ Restarting backend…"
sudo pkill -9 -f uvicorn 2>/dev/null || true
sleep 2
cd backend
source .venv/bin/activate
pip install -q -r requirements.txt
setsid nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 \
  > ~/uvicorn.log 2>&1 < /dev/null & disown

sleep 3
echo "▶ Verifying…"
ps -eo pid,etime,cmd | grep uvicorn | grep -v grep | head -1
curl -sf http://127.0.0.1:8000/api/health && echo " ✓ Backend healthy"

echo "✓ Deploy complete"
