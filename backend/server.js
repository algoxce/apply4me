// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// --- Config from env ---
const PORT = parseInt(process.env.PORT || "5000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "change-me";

// --- CORS ---
const corsOptions = {
  origin: function (origin, callback) {
    // allow tools/curl (no origin) and any whitelisted origin
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
};
app.use(cors(corsOptions));

// --- Body parsers ---
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// --- Multer (store in memory; we push bytes to DB) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// --- Helpers ---
function requireAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Basic "))
      return res
        .status(401)
        .set("WWW-Authenticate", "Basic")
        .json({ error: "Auth required" });

    const raw = Buffer.from(auth.replace("Basic ", ""), "base64").toString(
      "utf8"
    );
    const [user, pass] = raw.split(":");
    if (user === ADMIN_USER && pass === ADMIN_PASS) return next();

    return res.status(403).json({ error: "Forbidden" });
  } catch (e) {
    return res.status(401).json({ error: "Auth required" });
  }
}

function sanitizeSubmission(s) {
  // Never send resume bytes back in list/detail APIs.
  const { resumeData, ...rest } = s;
  return {
    ...rest,
    resumePresent: !!s.resumeSize,
  };
}

// --- Health & root ---
app.get("/", (_req, res) => {
  res.send(`Apply4Me API is running ✅ (env: ${NODE_ENV})`);
});

app.get("/health", async (_req, res) => {
  try {
    // quick DB check
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, env: NODE_ENV, uptime: process.uptime() });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// --- Public: Submit application ---
app.post(
  "/api/submit",
  upload.single("resume"), // form-data field name = "resume"
  async (req, res) => {
    try {
      const { name, email, mobile, message } = req.body;

      // Basic validation
      if (!name || !email) {
        return res.status(400).json({ error: "name and email are required" });
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) return res.status(400).json({ error: "invalid email" });

      let resumeFields = {};
      if (req.file) {
        const f = req.file;
        resumeFields = {
          resumeData: f.buffer,
          resumeContentType: f.mimetype || "application/octet-stream",
          resumeOriginalName: f.originalname || "resume.bin",
          resumeSize: f.size || null,
        };
      }

      const created = await prisma.submission.create({
        data: {
          name,
          email,
          mobile: mobile || null,
          message: message || null,
          ...resumeFields,
        },
      });

      res.status(201).json({
        ok: true,
        id: created.id,
        createdAt: created.createdAt,
      });
    } catch (e) {
      console.error("Submit error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// --- Admin: List submissions (paginated) ---
app.get("/api/submissions", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize || "20", 10), 1),
      100
    );
    const search = (req.query.search || "").toString().trim();

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { mobile: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          message: true,
          resumeSize: true,
          resumeOriginalName: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      items: items.map((i) => ({
        ...i,
        resumePresent: !!i.resumeSize,
      })),
    });
  } catch (e) {
    console.error("List error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Admin: Submission detail ---
app.get("/api/submissions/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const s = await prisma.submission.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        message: true,
        resumeContentType: true,
        resumeOriginalName: true,
        resumeSize: true,
        createdAt: true,
      },
    });

    if (!s) return res.status(404).json({ error: "Not found" });
    res.json({ ...s, resumePresent: !!s.resumeSize });
  } catch (e) {
    console.error("Detail error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Admin: Download resume (binary) ---
app.get("/api/submissions/:id/resume", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const s = await prisma.submission.findUnique({
      where: { id },
      select: {
        resumeData: true,
        resumeContentType: true,
        resumeOriginalName: true,
        resumeSize: true,
      },
    });

    if (!s || !s.resumeData)
      return res.status(404).json({ error: "No resume for this submission" });

    res.setHeader(
      "Content-Type",
      s.resumeContentType || "application/octet-stream"
    );
    const filename = s.resumeOriginalName || `resume-${id}.bin`;
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/"/g, "")}"`
    );
    res.setHeader("Content-Length", s.resumeSize || s.resumeData.length);
    return res.send(Buffer.from(s.resumeData));
  } catch (e) {
    console.error("Resume error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Global error safety ---
app.use((err, _req, res, _next) => {
  console.error("Unhandled:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(
    `Apply4Me backend listening on http://localhost:${PORT} (env: ${NODE_ENV})`
  );
});
