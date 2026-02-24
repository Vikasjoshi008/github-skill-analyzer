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
    const baseScore = totalStars * 5 + validCodeRepos * 2;
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
        size: r.size,
      }));

      const response = await mistral.chat.complete({
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content: `You are a Senior Technical Architect and Technical Recruiter. Grade this GitHub profile on a scale of 1 to 10.
      
      CRITICAL GRADING INSTRUCTIONS:
      - 1/10: Empty repositories, placeholders, or only template code (e.g., just 'Hello World').
      - 2-3/10: Beginner. Simple scripts, basic HTML/CSS, or small logic exercises (e.g., basic calculator).
      - 4-6/10: Intermediate. Functional applications using frameworks (React, Express, etc.) with clear logic.
      - 7-9/10: Advanced. Production-ready code, complex architecture, testing, and good documentation.
      - 10/10: Expert. High community impact (stars), deep technical complexity, or unique architectural innovations.

      Analyze the data to provide:
      1. 'skill_rating': A number from 1-10 based strictly on the complexity and quality of CODE found.
      2. 'detected_role': Primary role (e.g., Full Stack, Backend).
      3. 'used_stack': Specific tools/frameworks used.
      4. 'missing_stack': All essential industry-standard modern tools for their role NOT found in their repos.
      5. 'persona': A 1-sentence summary.
      6. 'pitch': A 2-sentence recruiter pitch.

      Return ONLY a valid JSON object.`,
          },
          {
            role: "user",
            content: `Username: ${cleanUsername}. Bio: ${profile.bio}. Repos Data: ${JSON.stringify(repoContext)}`,
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
