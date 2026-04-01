# 🚀 GitHub Skill Analyzer

An AI-powered technical auditing tool that evaluates GitHub profiles, calculates skill scores, and generates recruiter-ready career insights. Built with **Next.js**, **TypeScript**, and **Mistral AI**.

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://your-vercel-link.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Mistral AI](https://img.shields.io/badge/Mistral_AI-Powered-FF6000?style=for-the-badge&logo=mistralai&logoColor=white)](https://mistral.ai/)

## ✨ Key Features

- **Technical Audit Persona:** Analyzes code history to generate a professional developer "vibe check."
- **Target Match Analysis:** Compares profiles against specific Job Descriptions (JD) to provide a compatibility percentage.
- **Repo-Specific Refactoring:** Provides 2-3 specific technical improvement suggestions for your top 3 repositories.
- **Professional README Generator:** One-click generation of high-quality documentation for your standout projects.
- **Mobile-First UI:** Fully responsive design with glassmorphism and smooth Framer Motion animations.
- **Share Card Support:** Native Web Share API integration to post results on social media.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **AI Engine:** Mistral AI (`mistral-small-latest`)
- **Data:** GitHub REST API v3

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- A Mistral AI API Key

### Installation

1. **Clone the repo**

   ```bash
   git clone [https://github.com/Vikasjoshi008/github-skill-analyzer.git](https://github.com/Vikasjoshi008/github-skill-analyzer.git)
   cd github-skill-analyzer

   ```

2. **Install dependencies**

   ```bash
   npm install

   ```

3. **Environment Setup**
   Create a .env.local file in the root directory:

   MISTRAL_API_KEY=your_api_key_here

   # Optional: Increase rate limits

   GITHUB_TOKEN=your_github_personal_access_token
   Run Development Server

   Bash
   npm run dev

📸 Preview
(Add your mobile and desktop screenshots here to showcase the responsive UI)

📄 License
Distributed under the MIT License. See LICENSE for more information.

Developed by Vikas Joshi

### Tips for your Repository:

1. **The "About" Section:** Make sure to paste the description and your Vercel link in the GitHub sidebar under "About."
2. **The `LICENSE` File:** Create a new file in your root folder named `LICENSE` and paste the standard MIT License text into it. This makes the project look official.
3. **Screenshots:** Since you spent time on the mobile responsiveness, add two images side-by-side in the `README`—one showing the desktop view and one showing the mobile view.
