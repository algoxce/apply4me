import { useEffect, useState } from "react";
import { createCheckout } from "../lib/api";

export default function Pricing() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get("success")) {
      alert("Payment successful ✅ — your credits/plan will update shortly.");
      history.replaceState({}, "", location.pathname);
    }
  }, []);

  const buy = (product) => {
    if (!email) return alert("Enter your email first");
    createCheckout(email, product);
  };

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        padding: "0 16px",
        fontFamily: "system-ui,Segoe UI,Arial",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Pricing</h1>
      <p style={{ color: "#334155" }}>
        Start free. Upgrade anytime. Prices in <b>QAR</b>.
      </p>

      <div style={{ display: "flex", gap: 12, margin: "18px 0" }}>
        <input
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: 12,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            flex: 1,
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
        }}
      >
        <Card
          title="Free"
          price="QAR 0"
          blurb="5 credits total"
          features={["Basic apply"]}
          cta="Current"
          disabled
        />
        <Card
          title="20 Credits"
          price="QAR 35"
          blurb="One-time pack"
          features={["1 credit = 1 application"]}
          onClick={() => buy("credits_20")}
        />
        <Card
          title="50 Credits"
          price="QAR 69"
          blurb="Best value"
          features={["1 credit = 1 application"]}
          onClick={() => buy("credits_50")}
        />
        <Card
          highlight
          title="Pro Monthly"
          price="QAR 45/mo"
          blurb="100 credits every month"
          features={["Priority queue", "Saved cover letters"]}
          onClick={() => buy("pro_monthly")}
        />
      </div>
    </div>
  );
}

function Card({
  title,
  price,
  blurb,
  features = [],
  onClick,
  cta = "Buy",
  disabled,
  highlight,
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 20,
        background: "#fff",
        boxShadow: highlight
          ? "0 10px 30px rgba(109,40,217,.18)"
          : "0 2px 8px rgba(0,0,0,.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <h3 style={{ margin: "4px 0" }}>{title}</h3>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: highlight ? "#6d28d9" : "#111827",
          }}
        >
          {price}
        </div>
      </div>
      <p style={{ margin: "6px 0 10px", color: "#475569" }}>{blurb}</p>
      <ul
        style={{ margin: "10px 0 16px", paddingLeft: "18px", color: "#334155" }}
      >
        {features.map((f, i) => (
          <li key={i} style={{ margin: "4px 0" }}>
            {f}
          </li>
        ))}
      </ul>
      <button
        disabled={disabled}
        onClick={onClick}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: "none",
          background: disabled ? "#e5e7eb" : highlight ? "#6d28d9" : "#111827",
          color: "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: 600,
        }}
      >
        {cta}
      </button>
    </div>
  );
}
