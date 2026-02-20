"use client";

import { useState } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyzeProfile = async () => {
    if (!username) return;

    setLoading(true);

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">
        AI GitHub Skill Analyzer
      </h1>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter GitHub Username"
          className="border p-2 rounded w-64"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          onClick={analyzeProfile}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Analyze
        </button>
      </div>

      {loading && <p className="mt-4">Analyzing...</p>}

      {result && (
        <div className="mt-6 p-4 bg-white shadow rounded w-full max-w-xl">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}