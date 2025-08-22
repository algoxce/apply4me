// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const ADMIN_MAX_LIMIT = parseInt(process.env.ADMIN_MAX_LIMIT || "100", 10); // cap per page

// ----- CORS -----
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    const allowAll = allowedOrigins.length === 0;
    if (!origin || allowAll || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ----- Uploads (10MB limit) -----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ----- Basic Auth middleware for admin endpoints -----
function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  const len = Math.max(aBuf.length, bBuf.length);
  const aPad = Buffer.concat([aBuf, Buffer.alloc(len - aBuf.length)]);
  const bPad = Buffer.concat([bBuf, Buffer.alloc(len - bBuf.length)]);
  return crypto.timingSafeEqual(aPad, bPad);
}

function requireAdmin(req, res, next) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (!user || !pass) {
    res.set("Content-Type", "text/plain");
    return res
      .status(503)
      .send("Admin is not configured. Set ADMIN_USER and ADMIN_PASS in .env");
  }

  const header = req.headers["authorization"] || "";
  if (!header.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Apply4Me Admin"');
    return res.status(401).send("Authentication required");
  }
  let decoded = "";
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch (_) {}
  const idx = decoded.indexOf(":");
  const name = decoded.slice(0, idx);
  const password = decoded.slice(idx + 1);

  const ok = timingSafeEqual(name, user) && timingSafeEqual(password, pass);
  if (!ok) {
    res.set("WWW-Authenticate", 'Basic realm="Apply4Me Admin"');
    return res.status(401).send("Invalid credentials");
  }
  return next();
}

// ----- Routes -----
// Public health check
app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "healthy",
      db: "connected",
      env: NODE_ENV,
      cors: allowedOrigins,
    });
  } catch (e) {
    res.status(500).json({ status: "unhealthy", error: e.message });
  }
});

// Public submit (multipart/form-data)
app.post("/api/submit", upload.single("resume"), async (req, res) => {
  try {
    const { name, email, mobile, message } = req.body;
    if (!name || !email)
      return res.status(400).json({ error: "Name and Email are required." });

    let resumeData = null,
      resumeContentType = null,
      resumeOriginalName = null,
      resumeSize = null;
    if (req.file) {
      resumeData = req.file.buffer;
      resumeContentType = req.file.mimetype;
      resumeOriginalName = req.file.originalname;
      resumeSize = req.file.size;
    }

    const created = await prisma.submission.create({
      data: {
        name,
        email,
        mobile,
        message,
        resumeData,
        resumeContentType,
        resumeOriginalName,
        resumeSize,
      },
    });

    res.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("Submit error:", err);
    res
      .status(500)
      .json({
        error: "Server error",
        details: NODE_ENV === "development" ? err.message : undefined,
      });
  }
});

// ----- PAGINATED ADMIN JSON -----
// GET /api/submissions?limit=50&cursor=LAST_ID
app.get("/api/submissions", requireAdmin, async (req, res) => {
  const take = Math.min(parseInt(req.query.limit || "20", 10), ADMIN_MAX_LIMIT);
  const cursorId = req.query.cursor ? Number(req.query.cursor) : undefined;
  if (req.query.cursor && !Number.isFinite(cursorId)) {
    return res.status(400).json({ error: "Invalid cursor" });
  }

  const items = await prisma.submission.findMany({
    orderBy: { id: "desc" }, // stable order
    take,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      message: true,
      createdAt: true,
      resumeOriginalName: true,
      resumeSize: true,
    },
  });

  const nextCursor = items.length === take ? items[items.length - 1].id : null;
  res.json({ items, nextCursor });
});

// Admin resume download (protected)
app.get("/api/submissions/:id/resume", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id))
    return res.status(400).json({ error: "Invalid id" });

  const row = await prisma.submission.findUnique({
    where: { id },
    select: {
      resumeData: true,
      resumeContentType: true,
      resumeOriginalName: true,
    },
  });

  if (!row || !row.resumeData)
    return res.status(404).json({ error: "No resume for this submission" });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(
      row.resumeOriginalName || `resume_${id}`
    )}"`
  );
  res.setHeader(
    "Content-Type",
    row.resumeContentType || "application/octet-stream"
  );
  return res.send(Buffer.from(row.resumeData));
});

// ----- Admin HTML with "Load more" (protected) -----
app.get("/admin", requireAdmin, async (_req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Apply4Me — Submissions</title>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    :root{--bg:#f8fafc;--card:#fff;--muted:#64748b;--border:#e5e7eb;--head:#f3f4f6}
    body{font-family: ui-sans-serif,system-ui,Segoe UI,Roboto,Arial; background: var(--bg); margin:0; padding:24px;}
    .wrap{max-width:1200px; margin:0 auto;}
    h1{margin:0 0 16px;}
    .card{background:var(--card); box-shadow:0 10px 30px rgba(0,0,0,.08); border-radius:12px; overflow:hidden;}
    table{width:100%; border-collapse:collapse;}
    th,td{padding:10px 12px; border-bottom:1px solid var(--border); font-size:14px; vertical-align:top;}
    th{background:var(--head); text-align:left;}
    .cap{color:var(--muted); font-size:12px; margin:6px 0 18px;}
    .actions{display:flex; gap:8px; padding:12px; justify-content:flex-end; background:var(--head); border-bottom:1px solid var(--border);}
    button{padding:8px 12px; border-radius:8px; border:1px solid var(--border); background:#fff; cursor:pointer;}
    button:disabled{opacity:.5; cursor:not-allowed;}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Submissions</h1>
    <div class="cap">Protected with HTTP Basic Auth • Paginated • Max per page: ${ADMIN_MAX_LIMIT}</div>
    <div class="card">
      <div class="actions">
        <label>Page size:
          <input id="limit" type="number" value="50" min="1" max="${ADMIN_MAX_LIMIT}" style="width:80px;padding:6px 8px;border:1px solid var(--border);border-radius:6px;">
        </label>
        <button id="reload">Reload</button>
        <button id="loadMore">Load more</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Email</th><th>Mobile</th><th>Created</th><th>Resume</th><th>Size</th><th>Action</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
  </div>
  <script>
    const rowsEl = document.getElementById('rows');
    const loadMoreBtn = document.getElementById('loadMore');
    const reloadBtn = document.getElementById('reload');
    const limitEl = document.getElementById('limit');

    let nextCursor = null;
    let loading = false;

    function esc(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',\"'\":'&#39;'}[c])); }

    function tr(r){
      const created = new Date(r.createdAt).toLocaleString();
      const size = r.resumeSize ?? "";
      const resume = esc(r.resumeOriginalName ?? "");
      const dl = resume ? \`<a href="/api/submissions/\${r.id}/resume">Download</a>\` : "";
      return \`<tr>
        <td>\${r.id}</td>
        <td>\${esc(r.name)}</td>
        <td>\${esc(r.email)}</td>
        <td>\${esc(r.mobile)}</td>
        <td>\${created}</td>
        <td>\${resume}</td>
        <td>\${size}</td>
        <td>\${dl}</td>
      </tr>\`;
    }

    async function fetchPage({ cursor } = {}) {
      if (loading) return;
      loading = true;
      loadMoreBtn.disabled = true;
      try {
        const limit = Math.min(Math.max(parseInt(limitEl.value||'50',10),1), ${ADMIN_MAX_LIMIT});
        const qs = new URLSearchParams({ limit: String(limit) });
        if (cursor) qs.set('cursor', String(cursor));
        const res = await fetch('/api/submissions?' + qs.toString());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const { items, nextCursor: nc } = await res.json();
        items.forEach(item => rowsEl.insertAdjacentHTML('beforeend', tr(item)));
        nextCursor = nc;
        loadMoreBtn.disabled = !nextCursor;
      } catch (e) {
        alert('Failed to load: ' + e.message);
      } finally {
        loading = false;
      }
    }

    reloadBtn.addEventListener('click', () => {
      rowsEl.innerHTML = '';
      nextCursor = null;
      fetchPage({});
    });
    loadMoreBtn.addEventListener('click', () => {
      if (nextCursor) fetchPage({ cursor: nextCursor });
    });

    // initial load
    fetchPage({});
  </script>
</body>
</html>`);
});

// ----- Error handler -----
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ----- Start -----
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Apply4Me Postgres backend running on http://localhost:${PORT} (${NODE_ENV})`
  );
  if (allowedOrigins.length)
    console.log("CORS allowed origins:", allowedOrigins);
  else console.log("CORS allowed origins: ALL (dev)");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
