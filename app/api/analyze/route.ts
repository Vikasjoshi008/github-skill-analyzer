import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
    }

    // Fetch GitHub profile
    const githubRes = await fetch(
      `https://api.github.com/users/${username}`
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
      `https://api.github.com/users/${username}/repos`
    );

    const repos = await repoRes.json();

    return NextResponse.json({
      name: profile.name,
      public_repos: profile.public_repos,
      followers: profile.followers,
      top_languages: repos.map((repo: any) => repo.language),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}