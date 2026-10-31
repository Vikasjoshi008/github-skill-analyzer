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

    // 1. Fetch ALL repositories with pagination
    let allRepos: any[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const repoRes = await fetch(
        `https://api.github.com/users/${cleanUsername}/repos?per_page=${perPage}&page=${page}&sort=updated`,
      );

      if (!repoRes.ok) break;

      const repos = await repoRes.json();
      if (repos.length === 0) break;

      allRepos = [...allRepos, ...repos];

      if (repos.length < perPage) break;
      page++;
    }

    // Fetch profile
    const profileRes = await fetch(
      `https://api.github.com/users/${cleanUsername}`,
    );
    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "GitHub user not found" },
        { status: 404 },
      );
    }
    const profile = await profileRes.json();

    // 2. Data Processing Logic
    let totalStars = 0;
    let totalForks = 0;
    let validCodeRepos = 0;
    const languageCount: Record<string, number> = {};

    allRepos.forEach((repo: any) => {
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

    // 3. Sort repos by activity and take the top 30
    const topActiveRepos = allRepos
      .filter((r: any) => !r.fork && r.size > 0)
      .sort((a: any, b: any) => {
        const scoreA =
          a.stargazers_count * 5 + a.forks_count * 3 + a.size / 1000;
        const scoreB =
          b.stargazers_count * 5 + b.forks_count * 3 + b.size / 1000;
        return scoreB - scoreA;
      })
      .slice(0, 30);

    // 4. Groq Llama Technical Audit
    let aiAnalysis = null;
    try {
      const repoContext = topActiveRepos.map((r: any) => ({
        name: r.name,
        desc: r.description,
        lang: r.language,
        topics: r.topics || [],
        size: r.size,
        stars: r.stargazers_count,
        forks: r.forks_count,
      }));

      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        temperature: 0.1,
        max_tokens: 4096, // Critical: Gives the reasoning model enough space to think and output JSON
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
  ]
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
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "skill_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                skill_rating: { type: "number" },
                detected_role: { type: "string" },
                used_stack: { type: "array", items: { type: "string" } },
                missing_stack: { type: "array", items: { type: "string" } },
                persona: { type: "string" },
                pitch: { type: "string" },
                match_percentage: { type: "number" },
                critical_gaps: { type: "string" },
                missing_project_idea: { type: "string" },
                missing_project_readme_snippet: { type: "string" },
                repo_improvements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      repo_name: { type: "string" },
                      suggestions: { type: "array", items: { type: "string" } },
                    },
                    required: ["repo_name", "suggestions"],
                    additionalProperties: false,
                  },
                },
              },
              required: [
                "skill_rating",
                "detected_role",
                "used_stack",
                "missing_stack",
                "persona",
                "pitch",
                "match_percentage",
                "critical_gaps",
                "missing_project_idea",
                "missing_project_readme_snippet",
                "repo_improvements",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content;

      if (typeof content === "string") {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);

          // 🧹 CLEANUP: Remove duplicates from AI output
          if (aiAnalysis.used_stack) {
            aiAnalysis.used_stack = [...new Set(aiAnalysis.used_stack)];
          }
          if (aiAnalysis.missing_stack) {
            aiAnalysis.missing_stack = [...new Set(aiAnalysis.missing_stack)];
          }
        } else {
          throw new Error("Model did not return valid JSON structure");
        }
      }
    } catch (aiErr) {
      console.error("AI analysis failed:", aiErr);
      // Fallback if AI fails completely
      aiAnalysis = {
        detected_role: "Developer",
        used_stack: sortedLanguages.slice(0, 3).map((l) => l.language),
        missing_stack: ["Unable to analyze (AI Error)"],
        persona: "The Builder",
        pitch: "Manual review required due to an AI processing error.",
        skill_rating: 0,
        match_percentage: 0,
        critical_gaps: "N/A",
        missing_project_idea: "N/A",
        missing_project_readme_snippet: "N/A",
        repo_improvements: [],
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
