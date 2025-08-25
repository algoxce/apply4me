// frontend/src/components/HomePricing.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePricing() {
  const nav = useNavigate();

  const wrap = {
    maxWidth: 1100,
    margin: "48px auto",
    padding: "0 16px",
    fontFamily: "system-ui,Segoe UI,Arial",
  };
  const grid = {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  };
  const card = (highlight) => ({
    border: "1px solid rgba(0,0,0,.1)",
    borderRadius: 16,
    padding: 18,
    background: highlight ? "rgba(109,40,217,.08)" : "rgba(0,0,0,.03)",
    boxShadow: "0 1px 4px rgba(0,0,0,.06)",
    color: "inherit",
  });
  const h2 = { fontSize: 28, margin: "0 0 8px" };
  const h3 = { margin: "6px 0", fontSize: 18 };
  const price = { fontSize: 22, fontWeight: 800 };
  const btn = (filled) => ({
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: filled ? "1px solid #6d28d9" : "1px solid #475569",
    background: filled ? "#6d28d9" : "transparent",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  });

  return (
    <section id="home-pricing" style={wrap}>
      <h2 style={h2}>Plans & Pricing</h2>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Start free. Upgrade anytime. Prices in <b>QAR</b>.
      </p>

      <div style={grid}>
        <div style={card(false)}>
          <h3 style={h3}>Free</h3>
          <div style={price}>QAR 0</div>
          <p style={{ opacity: 0.85 }}>5 credits total</p>
          <ul style={{ margin: "10px 0 16px", paddingLeft: 18, opacity: 0.75 }}>
            <li>Basic apply</li>
          </ul>
          <button
            onClick={() =>
              document
                .querySelector("#apply")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            style={btn(false)}
          >
            Try it free
          </button>
        </div>

        <div style={card(false)}>
          <h3 style={h3}>20 Credits</h3>
          <div style={price}>QAR 35</div>
          <p style={{ opacity: 0.85 }}>One-time pack</p>
          <ul style={{ margin: "10px 0 16px", paddingLeft: 18, opacity: 0.75 }}>
            <li>1 credit = 1 application</li>
          </ul>
          <button onClick={() => nav("/pricing")} style={btn(true)}>
            View pricing
          </button>
        </div>

        <div style={card(false)}>
          <h3 style={h3}>50 Credits</h3>
          <div style={price}>QAR 69</div>
          <p style={{ opacity: 0.85 }}>Best value</p>
          <ul style={{ margin: "10px 0 16px", paddingLeft: 18, opacity: 0.75 }}>
            <li>1 credit = 1 application</li>
          </ul>
          <button onClick={() => nav("/pricing")} style={btn(true)}>
            View pricing
          </button>
        </div>

        <div style={card(true)}>
          <h3 style={h3}>Pro Monthly</h3>
          <div style={price}>
            QAR 45<span style={{ fontSize: 14 }}>/mo</span>
          </div>
          <p style={{ opacity: 0.85 }}>100 credits every month</p>
          <ul style={{ margin: "10px 0 16px", paddingLeft: 18, opacity: 0.75 }}>
            <li>Priority queue</li>
            <li>Saved cover letters</li>
          </ul>
          <button onClick={() => nav("/pricing")} style={btn(true)}>
            View pricing
          </button>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={() => nav("/pricing")}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #6d28d9",
            background: "#6d28d9",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          See full pricing
        </button>
      </div>
    </section>
  );
}
