import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY || "" });

export async function POST(req: Request) {
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
            content: `You are an Expert Technical Auditor. Your task is to perform a role-specific mastery gap analysis. And compare the User's GitHub Profile against a specific Job Description (JD).

      EXECUTION STEPS:
      1. ANALYZE: Review the user's repos to determine their specific field (e.g., Data Analyst, DevOps Engineer, Full Stack, Data Scientist, Frontend, etc.).
      2. BENCHMARK: For that SPECIFIC role, recall the complete high-level industry standard (e.g., if Data Scientist, think of: Statistics, ML Ops, Data Cleaning, Visualization, Big Data tools).
      3. AUDIT: Compare the user's 'used_stack' against that role's complete professional ecosystem.
      4. GENERATE: Create a massive 'missing_stack' list (10-15 items) that covers advanced concepts the user hasn't shown yet (e.g., Caching for Backend, Model Deployment for Data Science, or Terraform for DevOps).

      GRADING (1-10):
      - 1: Placeholder/Empty.
      - 2-4: Beginner (Single-layer projects).
      - 5-7: Intermediate (Uses frameworks, clear logic).
      - 8-10: Expert (Architectural depth, stars, production tools).

      1. Calculate a 'match_percentage' (0-100%).
      2. Identify 'critical_gaps' specifically required by the JD but missing in the Repos. Write a DEEP technical analysis (minimum 3-4 sentences). Explain exactly which architectural concepts, security practices, or specific technologies the user is missing to be competitive for this role.
      3. Suggest 'The Missing Project': A specific project idea the user should build to prove they can handle this job. Suggest exactly TWO distinct, high-impact projects. Label them 'Project 1' and 'Project 2'. For each, provide a clear title and a 2-sentence explanation of those projects that specific security or architectural concepts it proves.

      RETURN JSON:
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
        "missing_project_readme_snippet": "string"
      }`,
          },
          {
            role: "user",
            content: `Username: ${cleanUsername}. 
            Bio: ${profile.bio}. 
            Repos Data: ${JSON.stringify(repoContext)}
            TARGET JOB DESCRIPTION: ${jobDescription || "Not provided - analyze general career path."}`,
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
