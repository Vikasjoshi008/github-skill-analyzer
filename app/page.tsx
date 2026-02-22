"use client";

import { useState } from "react";
import api from "../lib/axios";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<any | null>(null);
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
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            GitHub Skill Analyzer
          </h1>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter GitHub Username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={analyzeProfile}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
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
                <img src={result.profile.avatar} className="w-32 h-32 rounded-full border-4 border-purple-500/30" />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold">{result.profile.name}</h2>
                  <p className="text-zinc-400">@{result.profile.username}</p>
                  <p className="mt-2 text-zinc-300 italic">{result.profile.bio}</p>
                </div>
                <div className="bg-purple-500/10 p-6 rounded-2xl text-center border border-purple-500/20">
                  <p className="text-sm text-purple-400 uppercase tracking-widest font-bold">Skill Score</p>
                  <p className="text-5xl font-black text-purple-500">{result.stats.skill_score}</p>
                </div>
              </div>

              {/* AI Vibe Check Section */}
              {result.aiAnalysis && (
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 p-8 rounded-3xl"
                >
                  <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                    ✨ Mistral AI Recruiter Vibe Check
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs uppercase text-zinc-500 font-bold">Persona</span>
                      <p className="text-2xl font-semibold text-white">{result.aiAnalysis.persona}</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase text-zinc-500 font-bold">The Pitch</span>
                      <p className="text-zinc-300 leading-relaxed">{result.aiAnalysis.pitch}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Stats Grid */}
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
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center">
      <p className="text-zinc-500 text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  );
}