#!/bin/bash
# One-time setup: create GitHub repo and push
# Usage: GITHUB_TOKEN=ghp_xxx bash push_to_github.sh

GH=/tmp/gh_bin/gh_2.67.0_macOS_amd64/bin/gh

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: set GITHUB_TOKEN=ghp_xxx before running"
  exit 1
fi

echo "$GITHUB_TOKEN" | $GH auth login --with-token
cd /Users/giovannimeda/agentsoul
$GH repo create agentsoul --public --description "Identity, Personality & Reputation Infrastructure for AI Agents" 2>/dev/null || echo "repo may already exist"
git remote add origin https://github.com/gmeda2000/agentsoul.git 2>/dev/null || git remote set-url origin https://github.com/gmeda2000/agentsoul.git
git push -u origin main
echo "Done. Repo at: https://github.com/gmeda2000/agentsoul"
