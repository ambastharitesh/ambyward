#!/usr/bin/env bash
# RewardLens local push + remote deploy.
# Run on your Mac. Pushes commits to GitHub, then SSHs to EC2 to redeploy.
#
# Usage: ./push-deploy.sh [optional-commit-message]
#   If a commit message is provided and there are uncommitted changes, it commits them first.

set -e
cd "$(dirname "$0")"

EC2_USER="ubuntu"
EC2_HOST="34.210.245.118"
EC2_KEY="rewardlens.pem"

# Optional: auto-commit if a message was given
if [ -n "$1" ] && [ -n "$(git status --porcelain)" ]; then
  echo "▶ Committing local changes…"
  git add -A
  git commit -m "$1"
fi

echo "▶ Pushing to GitHub…"
git push origin main

echo "▶ Triggering EC2 deploy…"
ssh -i "$EC2_KEY" -o ConnectTimeout=15 "$EC2_USER@$EC2_HOST" \
  "bash ~/ambyward/deploy.sh"

echo "✓ Done — https://length-reaches-struck-edwards.trycloudflare.com/"
