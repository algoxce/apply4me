// frontend/src/components/ContactForm.jsx
import React, { useRef, useState } from "react";
import { submitWithRetry } from "../lib/submitWithRetry";

export default function ContactForm() {
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const inFlightRef = useRef(false);
  const abortRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      abortRef.current = new AbortController();
      await submitWithRetry(formData, { signal: abortRef.current.signal });
      form.reset();
      setStatus("success");
    } catch (err) {
      const nice = /timeout/i.test(String(err))
        ? "The server is waking up. Please try again."
        : err?.message || "Submission failed. Please try again.";
      setErrorMsg(nice);
      setStatus("error");
    } finally {
      inFlightRef.current = false;
      abortRef.current = null;
      // optional auto-clear to idle
      setTimeout(() => setStatus("idle"), 1800);
    }
  }

  const pending = status === "submitting";

  return (
    <section id="contact" className="px-4 py-10">
      <h2 className="text-2xl font-bold mb-4">Contact / Apply</h2>

      {/* ⬇️ Keep your existing form fields & styling; just add onSubmit and disabled bindings */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 max-w-xl"
        onKeyDown={(ev) => {
          if (pending && ev.key === "Enter") ev.preventDefault();
        }}
      >
        {/* Keep your existing inputs; just add disabled={pending} */}
        <input
          name="name"
          placeholder="Full name"
          className="border rounded px-3 py-2"
          required
          disabled={pending}
        />
        <input
          name="email"
          type="email"
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
          <label className="block text-sm mb-1">Resume (optional)</label>
          <input
            type="file"
            name="resume"
            accept=".pdf,.doc,.docx"
            className="border rounded px-3 py-2 w-full"
            disabled={pending}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className={`relative inline-flex items-center justify-center rounded-md px-4 py-2 text-white
            ${
              pending
                ? "bg-purple-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            } transition`}
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
      </form>

      {/* messages — keep or style however you like */}
      {status === "submitting" && (
        <p className="mt-3 text-gray-600">
          Waking the server & submitting… please wait.
        </p>
      )}
      {status === "success" && (
        <p className="mt-3 text-green-600">✅ Submitted successfully!</p>
      )}
      {status === "error" && <p className="mt-3 text-red-600">❌ {errorMsg}</p>}
    </section>
  );
}
