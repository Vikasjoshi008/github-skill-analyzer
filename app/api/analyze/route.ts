import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();
    const cleanUsername = username?.trim();

    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Fetch profile
    const profileRes = await fetch(
      `https://api.github.com/users/${cleanUsername}`,
      { cache: "no-store" }
    );

    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "GitHub user not found" },
        { status: 404 }
      );
    }

    const profile = await profileRes.json();

    // Fetch repos
    const repoRes = await fetch(
      `https://api.github.com/users/${cleanUsername}/repos?per_page=100`,
      { cache: "no-store" }
    );

    const repos = await repoRes.json();

    let totalStars = 0;
    let totalForks = 0;
    let forkedRepos = 0;

    const languageCount: Record<string, number> = {};

    repos.forEach((repo: any) => {
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;

      if (repo.fork) forkedRepos++;

      if (repo.language) {
        languageCount[repo.language] =
          (languageCount[repo.language] || 0) + 1;
      }
    });

    const sortedLanguages = Object.entries(languageCount)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      profile: {
        username: profile.login,
        name: profile.name || profile.login,
        avatar: profile.avatar_url,
        bio: profile.bio,
        followers: profile.followers,
        following: profile.following,
        public_repos: profile.public_repos,
        joined: profile.created_at,
        updated: profile.updated_at,
      },
      stats: {
        total_stars: totalStars,
        total_forks: totalForks,
        forked_repos: forkedRepos,
      },
      languages: sortedLanguages,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}