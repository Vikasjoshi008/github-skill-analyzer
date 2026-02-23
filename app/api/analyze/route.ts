import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || "" });

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    const cleanUsername = username?.trim();

    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    // 1. Parallel Fetching for better performance
    const [profileRes, repoRes] = await Promise.all([
      fetch(`https://api.github.com/users/${cleanUsername}`),
      fetch(
        `https://api.github.com/users/${cleanUsername}/repos?per_page=100&sort=updated`,
      ),
    ]);

    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "GitHub user not found" },
        { status: 404 },
      );
    }

    const profile = await profileRes.json();
    const repos = await repoRes.json();

    // 2. Data Processing Logic
    let totalStars = 0;
    let totalForks = 0;
    let validCodeRepos = 0;
    const languageCount: Record<string, number> = {};

    repos.forEach((repo: any) => {
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;
      if (repo.size > 0 && !repo.fork) {
        validCodeRepos++;
      }
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      }
    });
    const baseScore = totalStars * 2 + validCodeRepos * 2;
    const finalScore = Math.min(100, baseScore);

    const sortedLanguages = Object.entries(languageCount)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Mistral AI Technical Audit
    let aiAnalysis = null;
    try {
      // Create a detailed context of repos including topics
      const repoContext = repos.slice(0, 30).map((r: any) => ({
        name: r.name,
        desc: r.description,
        lang: r.language,
        topics: r.topics || [],
      }));

      const response = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: `You are a Senior Technical Architect. Analyze the GitHub data to:
            1. Identify the 'detected_role' (e.g., Full Stack, Data Analyst).
            2. List 'used_stack' (the tools/techs found in their repos).
            3. List 'missing_stack' (industry-standard tools for their role NOT found in repos).
            4. Provide a 'persona' summary and a 'pitch' for a recruiter.
            Return ONLY a valid JSON object.`,
          },
          {
            role: "user",
            content: `Username: ${cleanUsername}. Bio: ${profile.bio}. Languages: ${sortedLanguages
              .slice(0, 3)
              .map((l) => l.language)
              .join(", ")}. Repos: ${JSON.stringify(repoContext)}`,
          },
        ],
        responseFormat: { type: "json_object" },
      });

      const content = response.choices?.[0].message.content;
      if (typeof content === "string") {
        aiAnalysis = JSON.parse(content);
      }
    } catch (aiErr) {
      console.error("AI analysis failed:", aiErr);
      // Fallback object to prevent frontend crashes
      aiAnalysis = {
        detected_role: "Developer",
        used_stack: sortedLanguages.slice(0, 3).map((l) => l.language),
        missing_stack: ["Unable to analyze"],
        persona: "The Builder",
        pitch: "Manual review required.",
      };
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
        skill_score: finalScore,
      },
      languages: sortedLanguages,
      aiAnalysis,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
