#!/bin/bash

# Make sure we're in the right directory
cd /workspaces/codespaces-react

# Check if there are any uncommitted changes
echo "Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
  echo "There are uncommitted changes. Please commit or stash them before resetting."
  echo "You can use: git stash to temporarily save your changes"
  exit 1
fi

# Reset to the specific commit
echo "Resetting to commit c1309e6fbadaf2a7acbfd35da46e98c7d145ac39..."
git reset --hard c1309e6fbadaf2a7acbfd35da46e98c7d145ac39

echo "Repository has been reset to the specified commit."
echo "If this is a remote repository and you want to update it, you may need to force push:"
echo "git push -f origin main"
echo "(Only do this if you're sure and it's your personal repository)"
