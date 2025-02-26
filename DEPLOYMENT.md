# Deployment Process

This document outlines how to deploy the app and continue development without breaking the deployed version.

## Initial Deployment

1. Install dependencies if needed:
   ```bash
   npm install gh-pages --save-dev
   ```

2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

3. After running this command, your app will be:
   - Built into the `dist` folder
   - Pushed to a branch called `gh-pages`
   - Available at: https://yourusername.github.io/codespaces-react

## Development Workflow

### Working on Features without Breaking Deployment

1. Create feature branches for new work:
   ```bash
   git checkout -b feature/new-feature
   ```

2. Make your changes and test thoroughly

3. Once ready, merge to main:
   ```bash
   git checkout main
   git merge feature/new-feature
   ```

4. Deploy the updated version:
   ```bash
   npm run deploy
   ```

### Using GitHub Actions (Alternative)

The repository is configured with GitHub Actions that will automatically deploy when changes are pushed to the main branch.

Simply push to main, and the action will handle the deployment:
```bash
git push origin main
```

## Best Practices

1. Always test your changes locally before deploying
2. Keep feature branches small and focused
3. Use meaningful commit messages
4. Document major changes in the README

## Troubleshooting

If the deployment fails, check:
- That all dependencies are installed
- Your GitHub repository has Pages enabled (Settings > Pages)
- You have the correct permissions for the repository
