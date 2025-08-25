// frontend/src/components/Hero.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const nav = useNavigate();

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: "62vh",
        minHeight: 360,
        overflow: "hidden",
        borderBottom: "1px solid #eee",
        background: "#0b1020",
      }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero-poster.jpg"
        onError={(e) => {
          console.error("Hero video failed to load.", e);
          e.currentTarget.style.display = "none";
        }}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          filter: "brightness(0.55)",
        }}
      >
        <source src="/hero.webm" type="video/webm" />
        <source src="/hero.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55) 100%)",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 16px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <h1
          style={{
            fontSize: 38,
            lineHeight: 1.15,
            margin: "6px 0 8px",
            fontWeight: 800,
          }}
        >
          Apply to jobs in seconds — not hours
        </h1>
        <p
          style={{
            fontSize: 18,
            maxWidth: 720,
            color: "rgba(255,255,255,.88)",
            margin: "0 0 18px",
          }}
        >
          Fill once. We auto-complete every application with your details and
          resume. Start free, upgrade for more credits.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => nav("/pricing")}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "none",
              background: "#6d28d9",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            View Pricing
          </button>
          <a
            href="#apply"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.6)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Try it free
          </a>
        </div>
      </div>
    </section>
  );
}
