"use client";

import { useState } from "react";

const CATEGORY_OPTIONS = [
  "Beauty",
  "Fashion",
  "Food & Drink",
  "Electronics",
  "Home & Living",
  "Fitness",
  "Pet",
  "Baby & Kids",
  "Other"
];

const TONE_OPTIONS = [
  "Funny",
  "Educational",
  "Emotional",
  "Trendy",
  "Shocking"
];

const INITIAL_FORM = {
  productName: "",
  productCategory: CATEGORY_OPTIONS[0],
  targetAudience: "",
  tone: TONE_OPTIONS[0]
};

export default function HomePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [hooks, setHooks] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  async function generateHooks() {
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/hooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate hooks.");
      }

      if (!Array.isArray(data?.hooks) || data.hooks.length !== 10) {
        throw new Error("Unexpected response from the AI model.");
      }

      setHooks(data.hooks);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not generate hooks. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await generateHooks();
  }

  async function handleCopy(hook, index) {
    try {
      await navigator.clipboard.writeText(hook);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1200);
    } catch {
      setError("Could not copy to clipboard. Please copy manually.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-zinc-800 bg-card p-5 shadow-xl shadow-black/20 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          TikTok Hook Generator
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Generate 10 scroll-stopping video openings using Gemini.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Product name</span>
            <input
              type="text"
              required
              value={form.productName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, productName: event.target.value }))
              }
              className="h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm outline-none ring-accent transition focus:ring-2"
              placeholder="e.g. GlowFix Vitamin C Serum"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm text-zinc-300">Product category</span>
              <select
                value={form.productCategory}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    productCategory: event.target.value
                  }))
                }
                className="h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm outline-none ring-accent transition focus:ring-2"
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm text-zinc-300">Tone</span>
              <select
                value={form.tone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tone: event.target.value }))
                }
                className="h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm outline-none ring-accent transition focus:ring-2"
              >
                {TONE_OPTIONS.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Target audience</span>
            <input
              type="text"
              required
              value={form.targetAudience}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  targetAudience: event.target.value
                }))
              }
              className="h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm outline-none ring-accent transition focus:ring-2"
              placeholder='e.g. women aged 25-35 who love skincare'
            />
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-[#ff4b70] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating hooks...
              </>
            ) : (
              "Generate Hooks"
            )}
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </section>

      {hooks.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your 10 Hooks</h2>
          </div>

          <div className="grid gap-3">
            {hooks.map((hook, index) => (
              <article
                key={`${hook}-${index}`}
                className="rounded-xl border border-zinc-800 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm leading-relaxed text-zinc-100">
                    <span className="mr-2 text-accent">{index + 1}.</span>
                    {hook}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(hook, index)}
                    className={`min-w-24 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                      copiedIndex === index
                        ? "border-accent bg-accent text-white"
                        : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"
                    }`}
                  >
                    {copiedIndex === index ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={generateHooks}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-accent px-5 text-sm font-medium text-accent transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Regenerating..." : "Regenerate"}
          </button>
        </section>
      ) : null}
    </main>
  );
}
