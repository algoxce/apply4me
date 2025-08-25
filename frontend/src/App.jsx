// frontend/src/App.jsx
import React, { useState } from "react";
import Hero from "./components/Hero.jsx";

export default function App() {
  return (
    <>
      <Hero />
      <Features />
      <ApplyForm />
      <Footer />
    </>
  );
}

function Features() {
  const wrap = {
    maxWidth: 1100,
    margin: "32px auto",
    padding: "0 16px",
    fontFamily: "system-ui,Segoe UI,Arial",
  };
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 18,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
  };
  const grid = {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  };
  const h3 = { margin: "6px 0", fontSize: 18 };

  return (
    <section style={wrap}>
      <h2 style={{ fontSize: 28, margin: "6px 0 14px" }}>How Apply4Me works</h2>
      <div style={grid}>
        <div style={card}>
          <h3 style={h3}>1) Fill once</h3>
          <p style={{ color: "#475569" }}>
            Add your details and resume one time. We securely store them for
            future submissions.
          </p>
        </div>
        <div style={card}>
          <h3 style={h3}>2) One-click apply</h3>
          <p style={{ color: "#475569" }}>
            We auto-complete job forms for you. Each submission uses 1 credit.
          </p>
        </div>
        <div style={card}>
          <h3 style={h3}>3) Scale up with Pro</h3>
          <p style={{ color: "#475569" }}>
            Need volume? Upgrade to Pro for monthly credits and priority.
          </p>
        </div>
      </div>
    </section>
  );
}

function ApplyForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);

  const wrap = {
    maxWidth: 900,
    margin: "28px auto 48px",
    padding: "0 16px",
    fontFamily: "system-ui,Segoe UI,Arial",
  };
  const input = {
    width: "100%",
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    outline: "none",
  };

  async function onSubmit(e) {
    e.preventDefault();
    if (!name || !email) return alert("Please fill your name and email.");
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("name", name);
      fd.append("email", email);
      fd.append("mobile", mobile);
      fd.append("message", message);
      if (resume) fd.append("resume", resume);

      // Your Vercel rewrite proxies /api → Render backend
      const res = await fetch("/api/submit", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (res.status === 402 || data?.upgrade) {
        if (
          confirm(
            "You’re out of credits. Would you like to view pricing and add more credits now?"
          )
        ) {
          location.href = "/pricing";
        }
        return;
      }
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      alert("Submitted ✅ — 1 credit used.");
      setMessage("");
      setResume(null);
      // keep name/email/mobile for next time
    } catch (err) {
      console.error(err);
      alert(`Submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="apply" style={wrap}>
      <h2 style={{ fontSize: 28, margin: "0 0 10px" }}>Try it free</h2>
      <p style={{ color: "#475569", margin: "0 0 16px" }}>
        You start with <b>5 free credits</b>. Each submission uses 1 credit.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          }}
        >
          <input
            style={input}
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            style={input}
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <input
            style={input}
            placeholder="Mobile (optional)"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>

        <textarea
          style={{ ...input, minHeight: 100, resize: "vertical" }}
          placeholder="Optional message or role preferences"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: 12,
            border: "1px dashed #cbd5e1",
            borderRadius: 12,
            color: "#334155",
            background: "#f8fafc",
          }}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            style={{ display: "none" }}
          />
          <span>
            {resume
              ? `Attached: ${resume.name}`
              : "Attach resume (PDF/DOC/DOCX)"}
          </span>
        </label>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            disabled={loading}
            type="submit"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "#111827",
              color: "#fff",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting…" : "Submit application"}
          </button>

          <a
            href="/pricing"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #6d28d9",
              color: "#6d28d9",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            View pricing
          </a>
        </div>
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #e5e7eb",
        padding: "24px 16px",
        marginTop: 24,
        color: "#64748b",
        fontFamily: "system-ui,Segoe UI,Arial",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>© {new Date().getFullYear()} Apply4Me</div>
        <div style={{ display: "flex", gap: 14 }}>
          <a
            href="/pricing"
            style={{ color: "#475569", textDecoration: "none" }}
          >
            Pricing
          </a>
          <a href="/terms" style={{ color: "#475569", textDecoration: "none" }}>
            Terms
          </a>
          <a
            href="/privacy"
            style={{ color: "#475569", textDecoration: "none" }}
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
