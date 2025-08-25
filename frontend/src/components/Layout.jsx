import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const nav = useNavigate();
  return (
    <>
      <header
        style={{
          padding: 12,
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "transparent", // <-- no white background
          borderBottom: "none",
          backdropFilter: "saturate(120%) blur(6px)",
          WebkitBackdropFilter: "saturate(120%) blur(6px)",
        }}
      >
        <nav
          className="container"
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
          {/* Brand */}
          <div
            onClick={() => nav("/")}
            style={{
              fontWeight: 800,
              fontSize: 18,
              marginRight: 10,
              cursor: "pointer",
              color: "#a78bfa",
            }}
          >
            Apply4Me
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 16, flex: 1 }}>
            <NavLink
              to="/"
              style={({ isActive }) => ({
                textDecoration: "none",
                color: isActive ? "#e5e7eb" : "#94a3b8",
                fontWeight: isActive ? 700 : 500,
              })}
            >
              Home
            </NavLink>
            <NavLink
              to="/pricing"
              style={({ isActive }) => ({
                textDecoration: "none",
                color: isActive ? "#e5e7eb" : "#94a3b8",
                fontWeight: isActive ? 700 : 500,
              })}
            >
              Pricing
            </NavLink>
          </div>

          {/* CTA */}
          <button className="btn" onClick={() => nav("/pricing")}>
            View Pricing
          </button>
        </nav>
      </header>

      <main style={{ minHeight: "calc(100vh - 60px)" }}>
        <Outlet />
      </main>
    </>
  );
}
