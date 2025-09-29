import React, { useEffect, useMemo, useState } from "react";

function b64(s) {
  if (typeof window === "undefined") return "";
  return window.btoa(s);
}

function formatDate(s) {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

function toCSV(rows) {
  if (!rows?.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")].concat(
    rows.map((r) => headers.map((h) => esc(r[h])).join(","))
  );
  return lines.join("\n");
}

export default function AdminPage() {
  // Basic auth creds (saved in localStorage)
  const [user, setUser] = useState(localStorage.getItem("admin_user") || "");
  const [pass, setPass] = useState(localStorage.getItem("admin_pass") || "");
  const [authed, setAuthed] = useState(false);

  // Query state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState({ total: 0, items: [] });

  const authHeader = useMemo(() => {
    if (!user || !pass) return {};
    return { Authorization: `Basic ${b64(`${user}:${pass}`)}` };
  }, [user, pass]);

  async function fetchList(p = page, s = search, ps = pageSize) {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(ps),
      });
      if (s.trim()) params.set("search", s.trim());

      const res = await fetch(`/api/submissions?${params.toString()}`, {
        headers: { ...authHeader },
      });

      if (res.status === 401 || res.status === 403) {
        setErr("Unauthorized: check ADMIN_USER / ADMIN_PASS.");
        setAuthed(false);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Error ${res.status}: ${txt}`);
      }
      const json = await res.json();
      setData(json);
      setAuthed(true);
      localStorage.setItem("admin_user", user);
      localStorage.setItem("admin_pass", pass);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function downloadResume(id, originalName = "") {
    setErr("");
    try {
      const res = await fetch(`/api/submissions/${id}/resume`, {
        headers: { ...authHeader },
      });
      if (res.status === 404) {
        setErr("This submission has no resume.");
        return;
      }
      if (res.status === 401 || res.status === 403) {
        setErr("Unauthorized: check ADMIN_USER / ADMIN_PASS.");
        return;
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Error ${res.status}: ${txt}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalName || `resume-${id}.bin`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e.message || String(e));
    }
  }

  function exportCSV() {
    const rows = data.items.map((i) => ({
      id: i.id,
      name: i.name,
      email: i.email,
      mobile: i.mobile || "",
      message: (i.message || "").replace(/\s+/g, " ").slice(0, 500),
      resumePresent: i.resumePresent ? "yes" : "no",
      createdAt: formatDate(i.createdAt),
    }));
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions_page${page}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (user && pass) fetchList(page, search, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const canPrev = page > 1;
  const canNext = page * pageSize < (data?.total || 0);

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Apply4Me — Admin</h1>

      {/* Auth box */}
      <div className="rounded-xl border p-4 mb-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm mb-1">Admin User</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="ADMIN_USER"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Admin Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="ADMIN_PASS"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              className="border rounded px-4 py-2"
              onClick={() => fetchList(1, search, pageSize)}
            >
              {authed ? "Refresh" : "Login"}
            </button>
            {authed && (
              <button
                className="border rounded px-4 py-2"
                onClick={() => {
                  setAuthed(false);
                  localStorage.removeItem("admin_user");
                  localStorage.removeItem("admin_pass");
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
        {err && <p className="text-red-600 mt-2">{err}</p>}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-3">
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-3 py-2 w-64"
            placeholder="Search by name, email, mobile"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              (setPage(1), fetchList(1, e.target.value, pageSize))
            }
          />
          <button
            className="border rounded px-4 py-2"
            onClick={() => {
              setPage(1);
              fetchList(1, search, pageSize);
            }}
          >
            Search
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm">Page size</label>
          <select
            className="border rounded px-2 py-2"
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button className="border rounded px-4 py-2" onClick={exportCSV}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "ID",
                "Name",
                "Email",
                "Mobile",
                "Message",
                "Resume",
                "Created",
              ].map((h) => (
                <th key={h} className="text-left px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4" colSpan={7}>
                  Loading…
                </td>
              </tr>
            ) : (data.items || []).length ? (
              data.items.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="px-3 py-2">{i.id}</td>
                  <td className="px-3 py-2">{i.name}</td>
                  <td className="px-3 py-2">{i.email}</td>
                  <td className="px-3 py-2">{i.mobile || "-"}</td>
                  <td className="px-3 py-2 max-w-[360px]">
                    <div className="line-clamp-2 whitespace-pre-wrap">
                      {i.message || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {i.resumePresent ? (
                      <button
                        className="border rounded px-3 py-1"
                        onClick={() =>
                          downloadResume(i.id, i.resumeOriginalName)
                        }
                      >
                        Download
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">{formatDate(i.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-4" colSpan={7}>
                  No submissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3 mt-3">
        <button
          className="border rounded px-3 py-2 disabled:opacity-50"
          disabled={!canPrev}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ← Prev
        </button>
        <div>Page {page}</div>
        <button
          className="border rounded px-3 py-2 disabled:opacity-50"
          disabled={!canNext}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
        <div className="text-sm text-gray-600">Total: {data.total || 0}</div>
      </div>
    </div>
  );
}
