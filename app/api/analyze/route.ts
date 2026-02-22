import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    const cleanUsername = username?.trim();

    if (!cleanUsername) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // 1. Parallel Fetching for better performance
    const [profileRes, repoRes] = await Promise.all([
      fetch(`https://api.github.com/users/${cleanUsername}`),
      fetch(`https://api.github.com/users/${cleanUsername}/repos?per_page=100&sort=updated`)
    ]);

    if (!profileRes.ok) {
      return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
    }

    const profile = await profileRes.json();
    const repos = await repoRes.json();

    // 2. Data Processing Logic
    let totalStars = 0;
    let totalForks = 0;
    let forkedReposCount = 0;
    const languageCount: Record<string, number> = {};

    repos.forEach((repo: any) => {
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;
      if (repo.fork) forkedReposCount++;
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      }
    });

    const sortedLanguages = Object.entries(languageCount)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Mistral AI Analysis
    let aiAnalysis = null;
    try {
      // Create a small metadata snapshot for the AI
      const repoContext = repos.slice(0, 15).map((r: any) => ({
        name: r.name,
        description: r.description,
        lang: r.language
      }));

      const response = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: "You are a technical recruiter. Analyze the following GitHub data and return a JSON object with: 'persona' (3-4 words), 'pitch' (2 sentences), and 'growth' (1 sentence)."
          },
          {
            role: "user",
            content: `User: ${cleanUsername}. Bio: ${profile.bio}. Languages: ${sortedLanguages.slice(0,3).map(l => l.language).join(", ")}. Repos: ${JSON.stringify(repoContext)}`
          }
        ],
        responseFormat: { type: "json_object" }
      });

      const content = response.choices?.[0].message.content;
      if (typeof content === 'string') {
        aiAnalysis = JSON.parse(content);
      }
    } catch (aiErr) {
      console.error("AI analysis failed:", aiErr);
      aiAnalysis = { persona: "The Builder", pitch: "Analysis unavailable.", growth: "N/A" };
    }

    return NextResponse.json({
      profile: {
        username: profile.login,
        name: profile.name || profile.login,
        avatar: profile.avatar_url,
        bio: profile.bio,
        followers: profile.followers,
        public_repos: profile.public_repos,
      },
      stats: {
        total_stars: totalStars,
        total_forks: totalForks,
        forked_repos: forkedReposCount,
        skill_score: Math.min(100, (totalStars * 2) + (profile.public_repos * 1.5)) // Custom formula
      },
      languages: sortedLanguages,
      aiAnalysis
    });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}