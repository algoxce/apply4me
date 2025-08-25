import React from "react";
import HomePricing from "./components/HomePricing.jsx"; // make sure this file exists (we added earlier)

export default function App() {
  return (
    <>
      {/* Simple built-in hero (no video) */}
      <section className="hero">
        <div className="container">
          <h1>
            Career Boost With <span style={{ color: "#a78bfa" }}>Apply4Me</span>
          </h1>
          <p>
            We apply for you — professionally, smartly, and effectively. Fill
            once, and let us auto-complete every application with your details
            and resume.
          </p>
          <div className="actions">
            <a className="btn" href="/pricing">
              Get Started
            </a>
            <a className="btn ghost" href="#apply">
              Try it free
            </a>
          </div>
        </div>
      </section>

      {/* Pricing teaser section on the homepage that links to /pricing */}
      <HomePricing />

      {/* Anchor target for “Try it free”. Replace with your real form/content. */}
      <section
        id="apply"
        className="container"
        style={{ margin: "40px auto 70px" }}
      >
        <h2 style={{ color: "#fff", margin: "0 0 8px" }}>Try it free</h2>
        <p style={{ color: "#94a3b8", margin: "0 0 16px" }}>
          You start with <b>5 free credits</b>. Each submission uses 1 credit.
        </p>
        {/* Your existing form goes here */}
        <div
          style={{
            padding: 18,
            borderRadius: 16,
            border: "1px dashed #334155",
            color: "#cbd5e1",
            background: "rgba(255,255,255,.02)",
          }}
        >
          <em>Place your apply form here (or keep your existing one).</em>
        </div>
      </section>
    </>
  );
}
