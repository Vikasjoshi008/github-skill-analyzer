import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    const cleanUsername = username?.trim();

    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    // Fetch profile
    const githubRes = await fetch(
      `https://api.github.com/users/${cleanUsername}`,
      { cache: "no-store" }
    );

    if (!githubRes.ok) {
      return NextResponse.json(
        { error: "GitHub user not found" },
        { status: 404 }
      );
    }

    const profile = await githubRes.json();

    // Fetch repositories
    const repoRes = await fetch(
      `https://api.github.com/users/${cleanUsername}/repos`,
      { cache: "no-store" }
    );

    const repos = await repoRes.json();

    // Extract languages
    const languageCount: Record<string, number> = {};

    repos.forEach((repo: any) => {
      if (repo.language) {
        languageCount[repo.language] =
          (languageCount[repo.language] || 0) + 1;
      }
    });

    // Convert to sorted array
    const sortedLanguages = Object.entries(languageCount)
      .map(([language, count]) => ({
        language,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      name: profile.name,
      public_repos: profile.public_repos,
      followers: profile.followers,
      languages: sortedLanguages,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}