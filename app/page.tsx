"use client";

import { useState } from "react";
import axios from "axios"

export default function Home() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyzeProfile = async () => {
    if (!username) return;
    try {
    setLoading(true);

    const res = await axios.post("/api/analyze", {
      username,
    });

    setResult(res.data);
  } catch (error) {
    console.error("Error analyzing profile:", error);
    alert("Failed to analyze profile. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-2xl bg-gray-900/60 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl p-8">

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
            className="bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-lg font-semibold cursor-pointer"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {result && (
          <div className="space-y-6">

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-800 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Name</p>
                <p className="text-lg font-semibold">{result.name}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Public Repos</p>
                <p className="text-lg font-semibold">{result.public_repos}</p>
              </div>

              <div className="bg-gray-800 p-4 rounded-xl">
                <p className="text-gray-400 text-sm">Followers</p>
                <p className="text-lg font-semibold">{result.followers}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-400 mb-2">Top Languages</p>
              <div className="flex flex-wrap gap-2">
                {result.top_languages
                  ?.filter((lang: string | null) => lang !== null)
                  .map((lang: string, index: number) => (
                    <span
                      key={index}
                      className="bg-purple-700/40 border border-purple-500 text-sm px-3 py-1 rounded-full"
                    >
                      {lang}
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