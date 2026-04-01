"use client";
import { useState } from "react";
import api from "../lib/axios";
import { motion, AnimatePresence } from "framer-motion";

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
    match_percentage?: number;
    critical_gaps?: string;
    missing_project_idea?: string;
    missing_project_readme_snippet?: string;
    repo_improvements: {
      repo_name: string;
      suggestions: string[];
    }[];
    readme_generator: {
      title: string;
      content: string;
    };
  };
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeProfile = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/analyze", {
        username: username.trim(),
        jobDescription: jobDescription.trim(),
      });
      setResult(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Something went wrong during analysis.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const shareData = {
      title: "My GitHub Skill Analysis",
      text: `Check out my GitHub analysis! I got a Skill Score of ${result.aiAnalysis.skill_rating}/10 and I'm a ${result.aiAnalysis.match_percentage}% match for a ${result.aiAnalysis.detected_role} role.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text} ${shareData.url}`,
        );
        alert("Analysis results copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  function StatBox({ label, value }: { label: string; value: number }) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-3 md:p-4 rounded-xl text-center">
        <p className="text-zinc-500 text-[10px] md:text-xs uppercase font-bold">
          {label}
        </p>
        <p className="text-lg md:text-xl font-bold mt-1 tracking-tight">
          {value.toLocaleString()}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 py-2 mt-5">
            GitHub Skill Analyzer
          </h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Enter GitHub Username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-800 p-3 md:p-4 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <button
              onClick={analyzeProfile}
              disabled={loading}
              className="bg-purple-600 px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          <textarea
            placeholder="Optional: Paste a Job Description to check your compatibility..."
            value={jobDescription}
            className="w-full bg-zinc-900 border border-zinc-800 p-3 md:p-4 rounded-xl text-sm text-zinc-300 h-28 md:h-32 resize-none outline-none focus:ring-1 focus:ring-zinc-700"
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-center text-sm">{error}</p>}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Profile Card */}
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row gap-6 md:gap-8 items-center relative overflow-hidden">
                <img
                  src={result.profile.avatar}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-purple-500/30"
                />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-xl md:text-2xl font-bold truncate max-w-[250px] mx-auto md:mx-0">
                    {result.profile.name}
                  </h2>
                  <p className="text-purple-400 font-medium text-sm md:text-base">
                    {result.aiAnalysis.detected_role}
                  </p>
                  <button
                    onClick={handleShare}
                    className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all mx-auto md:mx-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Share Results
                  </button>
                </div>
                <div className="bg-purple-500/10 p-4 rounded-2xl text-center border border-purple-500/20 min-w-[100px]">
                  <p className="text-[10px] text-purple-400 uppercase font-bold tracking-widest">
                    Skill Score
                  </p>
                  <p className="text-3xl md:text-4xl font-black text-purple-500">
                    {result.aiAnalysis.skill_rating}
                  </p>
                </div>
              </div>

              {/* Low contribution alert */}
              {result.stats.skill_score < 5 && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-red-400 text-xs md:text-sm">
                  ⚠️ This profile has limited public contributions.
                </div>
              )}

              {/* AI Vibe Check */}
              <motion.div
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 p-6 md:p-8 rounded-3xl"
              >
                <h3 className="text-lg md:text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                  ✨ Technical Auditor Summary
                </h3>
                <p className="italic text-gray-300 text-sm md:text-base mb-4">
                  "{result.aiAnalysis.persona}"
                </p>
                <p className="text-zinc-400 text-xs md:text-sm leading-relaxed mb-8">
                  {result.aiAnalysis.pitch}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-green-500/5 border border-green-500/20 p-4 md:p-6 rounded-2xl">
                    <h4 className="text-green-400 font-bold text-[10px] md:text-xs mb-3 uppercase tracking-tighter">
                      Mastered Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.aiAnalysis.used_stack.map((tech) => (
                        <span
                          key={tech}
                          className="bg-green-500/10 text-green-300 text-[10px] md:text-xs px-2 py-1 rounded-md"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-orange-500/5 border border-orange-500/20 p-4 md:p-6 rounded-2xl">
                    <h4 className="text-orange-400 font-bold text-[10px] md:text-xs mb-3 uppercase tracking-tighter">
                      Missing Key Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.aiAnalysis.missing_stack.map((tech) => (
                        <span
                          key={tech}
                          className="bg-orange-500/10 text-orange-300 text-[10px] md:text-xs px-2 py-1 rounded-md"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Target Match Analysis */}
              {result.aiAnalysis.match_percentage !== undefined && (
                <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 p-6 md:p-8 rounded-3xl shadow-2xl space-y-6">
                  <div className="flex flex-row justify-between items-center">
                    <h3 className="text-lg md:text-2xl font-bold text-blue-400 tracking-tight">
                      Target Match Analysis
                    </h3>
                    <div className="bg-blue-500/20 px-3 md:px-4 py-1 md:py-2 rounded-full border border-blue-500/40">
                      <span className="text-xl md:text-2xl font-black text-blue-400">
                        {result.aiAnalysis.match_percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm md:text-xl font-bold text-purple-400">
                      🛠️ Repo-Specific Improvements
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.aiAnalysis.repo_improvements.map((repo, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-900/80 border border-zinc-800 p-4 md:p-5 rounded-2xl"
                        >
                          <h5 className="text-white font-bold text-sm mb-2 truncate">
                            {repo.repo_name}
                          </h5>
                          <ul className="space-y-2">
                            {repo.suggestions.map((s, i) => (
                              <li
                                key={i}
                                className="text-[10px] md:text-xs text-zinc-400 flex gap-2"
                              >
                                <span className="text-purple-500">→</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] uppercase text-blue-300 font-bold mb-2 tracking-widest opacity-70">
                        Critical Gaps
                      </h4>
                      <p className="text-xs md:text-sm text-zinc-200 leading-relaxed font-medium">
                        {result.aiAnalysis.critical_gaps}
                      </p>
                    </div>
                    <div className="bg-black/40 p-4 md:p-6 rounded-2xl border border-white/5">
                      <h4 className="text-[10px] uppercase text-purple-400 font-bold mb-3 tracking-widest">
                        Recommended Strategic Projects
                      </h4>
                      <div className="text-xs md:text-sm text-zinc-300 leading-6 md:leading-7 whitespace-pre-line italic">
                        {result.aiAnalysis.missing_project_idea}
                      </div>
                    </div>
                  </div>

                  {/* README Generator */}
                  <div className="bg-zinc-900/90 border border-zinc-800 p-5 md:p-8 rounded-3xl mt-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <h3 className="text-base md:text-xl font-bold text-green-400">
                        📄 README Generator
                      </h3>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            result.aiAnalysis.readme_generator.content,
                          );
                          alert("README copied!");
                        }}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                      >
                        Copy Markdown
                      </button>
                    </div>
                    <div className="bg-black/50 p-4 md:p-6 rounded-xl border border-white/5 font-mono text-[10px] md:text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {result.aiAnalysis.readme_generator.content}
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
