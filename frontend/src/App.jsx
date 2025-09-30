// src/App.jsx
import React, { useEffect, useRef, useState } from "react";

export default function App() {
  // UI state
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  // Guards
  const inFlightRef = useRef(false);
  const abortRef = useRef(null);

  // 🔥 Warm the backend on first load (wakes Render free dyno)
  useEffect(() => {
    fetch("/api/health").catch(() => {});
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (inFlightRef.current) return; // hard guard: ignore extra clicks/Enter

    inFlightRef.current = true;
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // Optional: add any client-side validation here

      // Allow cancelation if component unmounts
      abortRef.current = new AbortController();

      const result = await submitWithRetry(formData, {
        signal: abortRef.current.signal,
      });
      console.log("Submission OK:", result);

      form.reset(); // ✅ clear form on success
      setStatus("success");
    } catch (err) {
      console.error("Submission failed:", err);
      // Friendlier message for timeouts / wake-ups
      const nice = /timeout/i.test(String(err))
        ? "The server is waking up. Please try again."
        : String(err?.message || err);
      setErrorMsg(nice);
      setStatus("error");
    } finally {
      inFlightRef.current = false;
      abortRef.current = null;

      // Optional: auto-clear messages after a moment
      setTimeout(() => {
        if (status !== "submitting") setStatus("idle");
      }, 1800);
    }
  }

  const pending = status === "submitting";

  return (
    <div className="min-h-screen flex items-start justify-center p-6">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-2">Apply4Me</h1>
        <p className="text-sm text-gray-600 mb-6">
          Submit your details below. We’ll get back to you shortly.
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-xl border p-4"
          onKeyDown={(ev) => {
            if (pending && ev.key === "Enter") ev.preventDefault();
          }}
        >
          <input
            name="name"
            placeholder="Full name"
            className="border rounded px-3 py-2"
            required
            disabled={pending}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="border rounded px-3 py-2"
            required
            disabled={pending}
          />
          <input
            name="mobile"
            placeholder="Mobile (optional)"
            className="border rounded px-3 py-2"
            disabled={pending}
          />
          <textarea
            name="message"
            placeholder="Message (optional)"
            className="border rounded px-3 py-2 min-h-[96px]"
            disabled={pending}
          />
          <div>
            <label className="block text-sm mb-1">
              Resume (PDF/DOC, optional)
            </label>
            <input
              type="file"
              name="resume"
              accept=".pdf,.doc,.docx"
              className="border rounded px-3 py-2 w-full"
              disabled={pending}
            />
          </div>

          <SubmitButton pending={pending} />
        </form>

        {/* Status messages */}
        {status === "submitting" && (
          <p className="mt-3 text-gray-600">
            Waking the server & submitting… please wait.
          </p>
        )}
        {status === "success" && (
          <p className="mt-3 text-green-600">✅ Submitted successfully!</p>
        )}
        {status === "error" && (
          <p className="mt-3 text-red-600">
            ❌ {errorMsg || "Submission failed. Please try again."}
          </p>
        )}
      </div>
    </div>
  );
}

/** Accessible submit button with spinner + disabled state */
function SubmitButton({ pending }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending ? "true" : "false"}
      className={`relative inline-flex items-center justify-center rounded-md px-4 py-2 text-white
        ${
          pending
            ? "bg-purple-400 cursor-not-allowed"
            : "bg-purple-600 hover:bg-purple-700"
        }
        transition`}
    >
      {pending && (
        <span className="absolute left-3 inline-block animate-spin">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </span>
      )}
      <span className={pending ? "opacity-70 pl-6" : ""}>
        {pending ? "Please wait…" : "Submit"}
      </span>
    </button>
  );
}

/** Submit helper with timeout + retries (handles Render cold starts) */
async function submitWithRetry(formData, { signal } = {}) {
  const withTimeout = (p, ms = 40000) =>
    Promise.race([
      p,
      new Promise((_, r) => setTimeout(() => r(new Error("timeout")), ms)),
    ]);

  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await withTimeout(
        fetch("/api/submit", { method: "POST", body: formData, signal }),
        40000
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Server error ${res.status}: ${txt}`);
      }
      return await res.json(); // ✅ success
    } catch (e) {
      lastErr = e;
      if (e.name === "AbortError") throw e; // stop if user navigated away
      // backoff: 1.5s, 3s, 4.5s
      await new Promise((r) => setTimeout(r, attempt * 1500));
    }
  }
  throw lastErr;
}
