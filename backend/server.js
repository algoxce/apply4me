// backend/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const multer = require("multer");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const ADMIN_MAX_LIMIT = parseInt(process.env.ADMIN_MAX_LIMIT || "100", 10);

// ----- CORS -----
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      const allowAll = allowedOrigins.length === 0;
      if (!origin || allowAll || allowedOrigins.includes(origin))
        cb(null, true);
      else cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

// ===== LEMON SQUEEZY WEBHOOK (must be BEFORE express.json) =====
app.post(
  "/api/lemonsqueezy/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
      const sig = req.header("X-Signature") || req.header("x-signature") || "";

      if (secret) {
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(req.body);
        const digest = `sha256=${hmac.digest("hex")}`;
        if (digest !== sig) {
          console.warn("LS webhook: signature mismatch");
          return res.status(400).send("invalid signature");
        }
      }

      const payload = JSON.parse(req.body.toString("utf8"));
      const event = payload?.meta?.event_name || payload?.event;

      // buyer email
      let email =
        payload?.data?.attributes?.user_email ||
        payload?.data?.attributes?.email ||
        payload?.data?.attributes?.customer_email ||
        null;

      // variant/product name
      const productName =
        payload?.data?.attributes?.first_order_item?.product_name ||
        payload?.data?.attributes?.product_name ||
        payload?.data?.attributes?.variant_name ||
        payload?.data?.attributes?.name ||
        "";

      if (!email) return res.json({ ok: true });

      let user = await getOrCreateUserByEmail(email);

      const isOrder = event === "order_created";
      const isSubStart = event === "subscription_created";
      const isSubRenew = event === "subscription_payment_success";

      if (isOrder) {
        let add = 0;
        if (/20\s*credit/i.test(productName)) add = 20;
        else if (/50\s*credit/i.test(productName)) add = 50;

        if (add > 0) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: user.id },
              data: { credits: { increment: add } },
            }),
            prisma.purchase.create({
              data: {
                userId: user.id,
                stripeSessionId: payload?.data?.id || `ls_${Date.now()}`,
                type: "credits",
                creditsGranted: add,
                amountCents: Math.round(
                  Number(payload?.data?.attributes?.subtotal) || 0
                ),
                currency: (
                  payload?.data?.attributes?.currency || "USD"
                ).toUpperCase(),
              },
            }),
          ]);
        }
      }

      if (isSubStart || isSubRenew) {
        const next = new Date();
        next.setMonth(next.getMonth() + 1);
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { plan: "pro", credits: 100, renewAt: next },
          }),
          prisma.purchase.create({
            data: {
              userId: user.id,
              stripeSessionId: payload?.data?.id || `ls_sub_${Date.now()}`,
              type: "subscription",
              plan: "pro",
              amountCents: Math.round(
                Number(payload?.data?.attributes?.subtotal) || 0
              ),
              currency: (
                payload?.data?.attributes?.currency || "USD"
              ).toUpperCase(),
            },
          }),
        ]);
      }

      return res.json({ received: true });
    } catch (e) {
      console.error("LS webhook error:", e);
      return res.json({ ok: true }); // avoid retries storm
    }
  }
);

// ===== JSON for other routes =====
app.use(express.json());

// ---- Uploads (resume) ----
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ===== Helpers =====
function timingSafeEqual(a, b) {
  const A = Buffer.from(String(a)),
    B = Buffer.from(String(b));
  const len = Math.max(A.length, B.length);
  return crypto.timingSafeEqual(
    Buffer.concat([A, Buffer.alloc(len - A.length)]),
    Buffer.concat([B, Buffer.alloc(len - B.length)])
  );
}

async function getOrCreateUserByEmail(email, referredByCode) {
  email = email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) return user;

  let referredBy = null;
  if (referredByCode) {
    referredBy = await prisma.user.findUnique({
      where: { referralCode: referredByCode },
    });
  }
  user = await prisma.user.create({
    data: {
      email,
      plan: "free",
      credits: 5,
      referredById: referredBy?.id ?? null,
    },
  });
  if (referredBy) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: referredBy.id },
        data: { credits: { increment: 2 } },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: 2 } },
      }),
      prisma.referral.create({
        data: {
          referrerId: referredBy.id,
          refereeId: user.id,
          bonusCredits: 2,
        },
      }),
    ]);
  }
  return user;
}

async function rolloverProIfNeeded(user) {
  if (user.plan !== "pro") return user;
  const now = new Date();
  if (!user.renewAt || now >= user.renewAt) {
    const next = new Date(now);
    next.setMonth(now.getMonth() + 1);
    user = await prisma.user.update({
      where: { id: user.id },
      data: { credits: 100, renewAt: next },
    });
  }
  return user;
}

// ===== Health =====
app.get("/api/health", async (_req, res) => {
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

// ===== Users =====
app.post("/api/user/upsert", async (req, res) => {
  try {
    const { email, ref } = req.body || {};
    if (!email) return res.status(400).json({ error: "email required" });
    let user = await getOrCreateUserByEmail(email, ref);
    user = await rolloverProIfNeeded(user);
    res.json({
      email: user.email,
      plan: user.plan,
      credits: user.credits,
      renewAt: user.renewAt,
      referralCode: user.referralCode,
    });
  } catch {
    res.status(500).json({ error: "server error" });
  }
});

app.get("/api/user/status", async (req, res) => {
  try {
    const email = String(req.query.email || "").toLowerCase();
    if (!email) return res.status(400).json({ error: "email required" });
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      user = await getOrCreateUserByEmail(email, String(req.query.ref || ""));
    user = await rolloverProIfNeeded(user);
    res.json({
      email: user.email,
      plan: user.plan,
      credits: user.credits,
      renewAt: user.renewAt,
      referralCode: user.referralCode,
    });
  } catch {
    res.status(500).json({ error: "server error" });
  }
});

// ===== Submissions (credits enforced) =====
app.post("/api/submit", upload.single("resume"), async (req, res) => {
  try {
    const { name, email, mobile, message, ref } = req.body;
    if (!name || !email)
      return res.status(400).json({ error: "Name and Email are required." });

    let user = await getOrCreateUserByEmail(email, ref);
    user = await rolloverProIfNeeded(user);

    if (user.credits <= 0) {
      return res
        .status(402)
        .json({
          error: "Out of credits",
          upgrade: true,
          referralCode: user.referralCode,
        });
    }

    const created = await prisma.submission.create({
      data: {
        name,
        email,
        mobile,
        message,
        userId: user.id,
        resumeData: req.file?.buffer || null,
        resumeContentType: req.file?.mimetype || null,
        resumeOriginalName: req.file?.originalname || null,
        resumeSize: req.file?.size || null,
      },
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
      }),
      prisma.usage.create({
        data: { userId: user.id, submissionId: created.id },
      }),
    ]);

    res.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== Admin =====
function requireAdmin(req, res, next) {
  const u = process.env.ADMIN_USER,
    p = process.env.ADMIN_PASS;
  if (!u || !p) return res.status(503).send("Admin is not configured.");
  const h = req.headers["authorization"] || "";
  if (!h.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Apply4Me Admin"');
    return res.status(401).send("Auth required");
  }
  const [name, pass] = Buffer.from(h.slice(6), "base64")
    .toString("utf8")
    .split(":");
  if (timingSafeEqual(name, u) && timingSafeEqual(pass, p)) return next();
  res.set("WWW-Authenticate", 'Basic realm="Apply4Me Admin"');
  return res.status(401).send("Invalid credentials");
}

app.get("/api/submissions", requireAdmin, async (req, res) => {
  const take = Math.min(parseInt(req.query.limit || "20", 10), ADMIN_MAX_LIMIT);
  const cursorId = req.query.cursor ? Number(req.query.cursor) : undefined;
  const items = await prisma.submission.findMany({
    orderBy: { id: "desc" },
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

app.get("/api/submissions/:id/resume", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
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
  res.send(Buffer.from(row.resumeData));
});

app.get("/admin", requireAdmin, async (_req, res) => {
  const rows = await prisma.submission.findMany({
    orderBy: { id: "desc" },
    take: 100,
  });
  const escape = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );
  const tr = (r) =>
    `<tr><td>${r.id}</td><td>${escape(r.name)}</td><td>${escape(
      r.email
    )}</td><td>${escape(r.mobile)}</td><td>${new Date(
      r.createdAt
    ).toLocaleString()}</td><td>${escape(r.resumeOriginalName ?? "")}</td><td>${
      r.resumeSize ?? ""
    }</td><td>${
      r.resumeOriginalName
        ? `<a href="/api/submissions/${r.id}/resume">Download</a>`
        : ""
    }</td></tr>`;
  res.setHeader("Content-Type", "text/html");
  res.send(`<!doctype html><html><head><meta charset="utf-8"/><title>Apply4Me — Submissions</title>
  <style>body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;padding:24px;background:#f8fafc}
  table{width:100%;border-collapse:collapse;background:#fff}th,td{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px}th{background:#f3f4f6}</style></head>
  <body><h1>Submissions (latest 100)</h1><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Mobile</th><th>Created</th><th>Resume</th><th>Size</th><th>Action</th></tr></thead><tbody>
  ${rows.map(tr).join("")}</tbody></table></body></html>`);
});

// ===== Lemon Squeezy checkout session =====
app.post("/api/checkout/session", async (req, res) => {
  try {
    const { email, product } = req.body || {};
    const map = {
      credits_20: process.env.LS_URL_20,
      credits_50: process.env.LS_URL_50,
      pro_monthly: process.env.LS_URL_PRO,
    };
    const base = map[product];
    if (!base) return res.status(400).json({ error: "unknown product" });

    const url = email
      ? `${base}?checkout[email]=${encodeURIComponent(email)}`
      : base;
    return res.json({ url });
  } catch (e) {
    console.error("LS session error:", e);
    return res.status(500).json({ error: "server error" });
  }
});

// ===== Start =====
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Apply4Me running on http://localhost:${PORT} (${NODE_ENV})`);
  console.log(
    allowedOrigins.length
      ? "CORS allowed origins: " + JSON.stringify(allowedOrigins)
      : "CORS allowed origins: ALL (dev)"
  );
});
