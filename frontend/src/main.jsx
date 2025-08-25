// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import App from "./App.jsx"; // your existing homepage
import Pricing from "./pages/Pricing.jsx";
import "./index.css"; // keep if you have global styles

function Layout() {
  return (
    <>
      <header style={{ padding: 12, borderBottom: "1px solid #eee" }}>
        <nav style={{ display: "flex", gap: 16 }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#111827" : "#475569",
              fontWeight: isActive ? 700 : 500,
            })}
          >
            Home
          </NavLink>
          <NavLink
            to="/pricing"
            style={({ isActive }) => ({
              textDecoration: "none",
              color: isActive ? "#111827" : "#475569",
              fontWeight: isActive ? 700 : 500,
            })}
          >
            Pricing
          </NavLink>
        </nav>
      </header>
      <main style={{ minHeight: "calc(100vh - 60px)" }}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  </React.StrictMode>
);
