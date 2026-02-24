"use client";

import { useState } from "react";
import api from "../lib/axios";
import { motion, AnimatePresence } from "framer-motion";

// Define the interface to match our new AI backend structure
interface ProfileData {
  profile: {
    username: string;
    name: string;
    avatar: string;
    bio: string;
    followers: number;
    public_repos: number;
  };
  stats: {
    total_stars: number;
    total_forks: number;
    skill_score: number;
  };
  languages: { language: string; count: number }[];
  aiAnalysis: {
    detected_role: string;
    persona: string;
    pitch: string;
    used_stack: string[];
    missing_stack: string[];
    skill_rating: number;
  };
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeProfile = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/analyze", { username: username.trim() });
      setResult(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Something went wrong during analysis.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            GitHub Skill Analyzer
          </h1>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="GitHub Username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={analyzeProfile}
              disabled={loading}
              className="bg-purple-600 px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Profile Card */}
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl flex flex-col md:flex-row gap-8 items-center">
                <img
                  src={result.profile.avatar}
                  className="w-24 h-24 rounded-full border-4 border-purple-500/30"
                />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold">{result.profile.name}</h2>
                  <p className="text-purple-400 font-medium">
                    {result.aiAnalysis.detected_role}
                  </p>
                </div>
                <div className="bg-purple-500/10 p-4 rounded-2xl text-center border border-purple-500/20">
                  <p className="text-xs text-purple-400 uppercase font-bold tracking-widest">
                    Skill Score
                  </p>
                  <p className="text-4xl font-black text-purple-500">
                    {result.aiAnalysis.skill_rating}
                  </p>
                </div>
              </div>

              {/* Inside result conditional in page.tsx */}
              {result.stats.skill_score < 5 && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 text-sm">
                  ⚠️ This profile has very limited active code. The score
                  reflects a lack of public contributions.
                </div>
              )}

              {/* AI Vibe Check & Tech Stacks */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-8 rounded-3xl"
              >
                <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                  ✨ Technical Auditor Summary
                </h3>
                <p className="italic text-gray-300 mb-4">
                  "{result.aiAnalysis.persona}"
                </p>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                  {result.aiAnalysis.pitch}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-500/5 border border-green-500/20 p-6 rounded-2xl">
                    <h4 className="text-green-400 font-bold text-sm mb-3 uppercase tracking-tighter">
                      Mastered Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.aiAnalysis.used_stack.map((tech) => (
                        <span
                          key={tech}
                          className="bg-green-500/10 text-green-300 text-xs px-2 py-1 rounded-md"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-2xl">
                    <h4 className="text-orange-400 font-bold text-sm mb-3 uppercase tracking-tighter">
                      Missing Key Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.aiAnalysis.missing_stack.map((tech) => (
                        <span
                          key={tech}
                          className="bg-orange-500/10 text-orange-300 text-xs px-2 py-1 rounded-md"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBox label="Stars" value={result.stats.total_stars} />
                <StatBox label="Forks" value={result.stats.total_forks} />
                <StatBox label="Repos" value={result.profile.public_repos} />
                <StatBox label="Followers" value={result.profile.followers} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-center">
      <p className="text-zinc-500 text-xs uppercase font-bold">{label}</p>
      <p className="text-xl font-bold mt-1 tracking-tight">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
