import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize Groq client using OpenAI SDK compatibility
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  console.log(">>> API HIT SUCCESSFUL");
  try {
    const { username, jobDescription } = await req.json();
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

    // 3. Groq Llama Technical Audit
    let aiAnalysis = null;
    try {
      const repoContext = repos.slice(0, 30).map((r: any) => ({
        name: r.name,
        desc: r.description,
        lang: r.language,
        topics: r.topics || [],
        size: r.size,
      }));

      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: `You are an Expert Technical Auditor. Your task is to perform a role-specific mastery gap analysis and compare the User's GitHub Profile against a specific Job Description (JD).

EXECUTION STEPS:
1. ANALYZE: Review the user's repos to determine their specific field (e.g., Data Analyst, DevOps Engineer, Full Stack, Data Scientist, Frontend, etc.).
2. BENCHMARK: For that SPECIFIC role, recall the complete high-level industry standard.
3. AUDIT: Compare the user's 'used_stack' against that role's complete professional ecosystem.
4. GENERATE: Create a massive 'missing_stack' list (10-15 items) covering advanced concepts.

GRADING (1-10):
- 1: Placeholder/Empty.
- 2-4: Beginner.
- 5-7: Intermediate.
- 8-10: Expert.

RETURN VALID JSON ONLY matching this structure:
{
  "skill_rating": number,
  "detected_role": "string",
  "used_stack": ["string"],
  "missing_stack": ["string"],
  "persona": "string",
  "pitch": "string",
  "match_percentage": number,
  "critical_gaps": "string",
  "missing_project_idea": "string",
  "missing_project_readme_snippet": "string",
  "repo_improvements": [
    { "repo_name": "string", "suggestions": ["string", "string"] }
  ],
  "readme_generator": {
    "title": "string",
    "content": "string (Markdown format)"
  }
}`,
          },
          {
            role: "user",
            content: `Username: ${cleanUsername}. 
            Bio: ${profile.bio || "None"}. 
            Repos Data: ${JSON.stringify(repoContext)}
            TARGET JOB DESCRIPTION: ${jobDescription || "Not provided - analyze general career path."}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content === "string") {
        aiAnalysis = JSON.parse(content);
      }
    } catch (aiErr) {
      console.error("AI analysis failed:", aiErr);
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
  } catch (error: any) {
    console.log("DETAILED SERVER ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
