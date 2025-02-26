# Deploying to GitHub Pages

Follow these steps to deploy the app to GitHub Pages:

## First-time setup

1. Install the gh-pages package if not already installed:

```bash
npm install gh-pages --save-dev
```

2. Make sure your package.json has the correct homepage URL:
   - It should be `https://yourusername.github.io/codespaces-react` 
   - Replace `yourusername` with your actual GitHub username

3. Ensure you have these scripts in package.json:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

## Deploy the application

Run the deploy command:

```bash
npm run deploy
```

This will:
1. Build your app
2. Push the built files to a gh-pages branch in your repository

## After deployment

1. Go to your GitHub repository settings
2. Navigate to "Pages" section
3. Ensure the source is set to "gh-pages" branch
4. Your site will be published at https://yourusername.github.io/codespaces-react

## Continue development after deployment

1. Make changes on your main branch or feature branches
2. Test thoroughly
3. When ready to update the live site, run `npm run deploy` again

Your deployed site is on the gh-pages branch, while your source code remains on the main branch - this separation allows you to continue development without affecting the live site until you're ready to deploy again.
