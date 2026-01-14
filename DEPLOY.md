# Deploying QuantWeb to Vercel

The most efficient way to deploy a Next.js application is through **Vercel**, which is created by the team behind Next.js.

### 1. Prepare your Git Repository
If you haven't already, push your code to a Git provider (GitHub, GitLab, or Bitbucket):

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit for deployment"

# Create a repository on GitHub, then link it
git remote add origin https://github.com/YOUR_USERNAME/quant-web.git
git branch -M main
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [Vercel](https://vercel.com) and sign in with your Git provider.
2. Click **"Add New"** > **"Project"**.
3. Select your `quant-web` repository from the list.
4. Click **"Deploy"**.

### 3. Automatic Updates
Once connected, every time you `git push` to your `main` branch, Vercel will automatically:
- Pull the new code.
- Run `npm run build`.
- Deploy the updated version to your production URL.

### 4. Why Vercel for this project?
- **Serverless Analytics**: Handles our `yahoo-finance2` API calls server-side efficiently.
- **Speed**: Global CDN for fast loading.
- **Zero Config**: Perfectly supports Next.js with zero setup required.

---
**Note**: Since our app uses `force-dynamic`, it will behave as a real-time Server-Side Rendered app on Vercel, ensuring your stock data is always fresh.
