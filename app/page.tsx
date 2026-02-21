"use client";

import { useState } from "react";
import api from "../lib/axios";

interface ProfileData {
  profile: {
    username: string;
    name: string;
    avatar: string;
    bio: string;
    followers: number;
    following: number;
    public_repos: number;
    joined: string;
    updated: string;
  };
  stats: {
    total_stars: number;
    total_forks: number;
    forked_repos: number;
  };
  languages: { language: string; count: number }[];
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyzeProfile = async () => {
    const cleanUsername = username.trim();
    if (!cleanUsername) return;

    setLoading(true);
    setError(null);        // 🔥 clear old error
    setResult(null);       // 🔥 clear old result

    try {
      const res = await api.post("/api/analyze", {
        username: cleanUsername,
      });

      setResult(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Failed to analyze profile."
      );
    } finally {
      setLoading(false);
    }
  };

  function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800 p-4 rounded-xl text-center">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-3xl bg-gray-900/60 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl p-8">

        <h1 className="text-4xl font-bold text-center mb-6">
          🚀 AI GitHub Skill Analyzer
        </h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Enter GitHub Username"
            className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <button
            onClick={analyzeProfile}
            disabled={!username.trim() || loading}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              !username.trim() || loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-6">

            {/* Profile */}
            <div className="flex items-center gap-4">
              <img
                src={result.profile.avatar}
                alt="avatar"
                className="w-20 h-20 rounded-full border border-gray-600"
              />
              <div>
                <h2 className="text-2xl font-bold">
                  {result.profile.name}
                </h2>
                <p className="text-gray-400">
                  @{result.profile.username}
                </p>
                <p className="text-sm text-gray-500">
                  Followers: {result.profile.followers} | Following: {result.profile.following}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Stat label="Public Repos" value={result.profile.public_repos} />
              <Stat label="Total Stars" value={result.stats.total_stars} />
              <Stat label="Total Forks" value={result.stats.total_forks} />
              <Stat label="Forked Repos" value={result.stats.forked_repos} />
            </div>

            {/* Languages */}
            <div>
              <p className="text-gray-400 mb-2">Top Languages</p>
              <div className="flex flex-wrap gap-2">
                {result.languages.map((lang, index) => (
                  <span
                    key={index}
                    className="bg-purple-700/40 border border-purple-500 text-sm px-3 py-1 rounded-full"
                  >
                    {lang.language}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}