// server.js ✅ CrashGuard Backend (Stable + Better Debug + No Auto Delete + CIVILIAN RADIUS FIX + RECEIPTS STATUS)

// const jwt = require("jsonwebtoken");

const express = require("express");
const cors = require("cors");
const { z } = require("zod");
const { v4: uuid } = require("uuid");
const { Expo } = require("expo-server-sdk");
require("dotenv").config();
// const authRoutes = require("./routes/auth");

// app.use("/v1/auth", authRoutes);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

// mount auth routes
app.use("/v1/auth", authRoutes);

const expo = new Expo();

//********************************************************************************************************************** */

// ===================== AUTH + USER SYSTEM (MONGODB) =====================

// -------------------- CONNECT MONGODB --------------------
connectDB();

// -------------------- USER SCHEMA --------------------
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: false },

  // Profile Fields
  name: String,
  bloodGroup: String,
  phone: String,
  address: String,
  parentPhone: String,

  createdAt: { type: Date, default: Date.now },
});

// const User = mongoose.model("User", userSchema);

// -------------------- EMAIL TRANSPORTER --------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// -------------------- JWT MIDDLEWARE --------------------
// function authMiddleware(req, res, next) {
//   const token = req.headers.authorization;
//   if (!token) return res.status(401).json({ error: "No token provided" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch {
//     res.status(401).json({ error: "Invalid token" });
//   }
// }

// ===================== AUTH ROUTES =====================

// -------- SIGNUP --------
app.post("/v1/auth/signup", async (req, res) => {
  try {

    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {

      const hashed = await bcrypt.hash(password, 10);

      user = await User.create({
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        password: hashed,
        verified: password === "google-auth" ? true : false
      });

      if (password !== "google-auth") {

        const token = jwt.sign(
          { id: user._id },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        const verifyLink = `http://localhost:4000/v1/auth/verify/${token}`;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: normalizedEmail,
          subject: "Verify your CrashGuard Account",
          html: `
            <h2>CrashGuard Email Verification</h2>
            <p>Click below to verify your account:</p>
            <a href="${verifyLink}">${verifyLink}</a>
          `,
        });

        return res.json({
          message: "Signup successful. Check your email to verify.",
        });

      }

    }

    const authToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token: authToken,
      user
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }
});


// -------- VERIFY EMAIL --------
app.get("/v1/auth/verify/:token", async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

    await User.findByIdAndUpdate(decoded.id, {
      verified: true,
    });

    res.send("✅ Email verified successfully. You can now login.");

  } catch {
    res.status(400).send("Invalid or expired verification link.");
  }
});


// -------- LOGIN --------
app.post("/v1/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user)
      return res.status(400).json({ error: "Invalid credentials" });

    if (!user.verified)
      return res.status(400).json({ error: "Email not verified" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET
    );

    res.json({
      token,
      message: "Login successful",
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// -------- FORGOT PASSWORD --------
app.post("/v1/auth/forgot", async (req, res) => {

  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.status(400).json({ error: "User not found" });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const link = `http://localhost:4000/reset/${token}`;

  await transporter.sendMail({
    to: email,
    from: process.env.EMAIL_USER,
    subject: "Reset Password",
    html: `<a href="${link}">Reset Password</a>`,
  });

  res.json({ message: "Reset email sent" });
});


// -------- GET PROFILE --------
app.get("/v1/auth/profile", async (req, res) => {

  try {

    const token = req.headers.authorization;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    res.json(user);

  } catch (err) {

    res.status(401).json({ error: "Unauthorized" });

  }

});


// -------- UPDATE PROFILE --------
app.put("/v1/auth/profile", async (req, res) => {

  try {

    const token = req.headers.authorization;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const {
      name,
      bloodGroup,
      phone,
      address,
      parentPhone
    } = req.body;

    const user = await User.findByIdAndUpdate(

      decoded.id,

      {
        name,
        bloodGroup,
        phone,
        address,
        parentPhone
      },

      { returnDocument: "after" }

    ).select("-password");

    res.json(user);

  } catch (err) {

    res.status(500).json({ error: "Profile update failed" });

  }

});

//**************************************************************************************************************** */

// In-memory stores
const events = new Map();
const helpers = new Map(); // user_id -> { user_id, push_token, location, updated_at }
const civilians = new Map(); // user_id -> { user_id, push_token, location, opt_in, updated_at }

// -------------------- Validation --------------------
const createEventSchema = z.object({
  type: z.enum(["CRASH", "VOICE_SOS", "MANUAL_SOS"]),
  source: z.enum(["MOBILE", "IOT"]).default("MOBILE"),
  location: z.object({ lat: z.number(), lng: z.number() }),
  signals: z
    .object({
      confidence: z.number().min(0).max(1).optional(),
      g_force_peak: z.number().optional(),
    })
    .optional(),
  countdown_sec: z.number().int().min(0).max(60).default(12),
});

// -------------------- Geo helpers --------------------
function toRad(v) {
  return (v * Math.PI) / 180;
}

function distanceMeters(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * ✅ OLD logic kept for fallback/testing, but NOT used by default anymore
 * Radius logic: first check 1km; if none, expand to 3km
 */
function pickRadiusForCivilians(center) {
  const r1 = 1000;
  const r2 = 3000;

  let countIn1 = 0;
  for (const c of civilians.values()) {
    if (c.opt_in === false) continue;
    if (!c.location) continue;
    const d = distanceMeters(center, c.location);
    if (d <= r1) countIn1++;
  }
  return countIn1 > 0 ? r1 : r2;
}

// -------------------- Push sender (Expo) FULL DEBUG --------------------
async function sendExpoPush(messages) {
  console.log("====================================");
  console.log(`🚀 Sending ${messages.length} push notifications`);

  const valid = [];
  const invalid = [];

  for (const m of messages) {
    if (m?.to && Expo.isExpoPushToken(m.to)) valid.push(m);
    else invalid.push(m?.to || null);
  }

  console.log(`✅ Valid tokens: ${valid.length}/${messages.length}`);
  console.log(`❌ Invalid tokens: ${invalid.length}`);

  if (valid.length === 0) {
    return {
      ok: true,
      sent: 0,
      invalid_count: invalid.length,
      invalid_samples: invalid.slice(0, 5),
      tickets: [],
      receipts: [],
      receipt_errors: [],
      error: "No valid Expo push tokens",
    };
  }

  const chunks = expo.chunkPushNotifications(valid);
  const tickets = [];
  const receipts = [];
  const receipt_errors = [];

  for (const chunk of chunks) {
    try {
      console.log("📤 Sending chunk to Expo servers...");
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);

      console.log(
        "🎫 Tickets:",
        ticketChunk.map((t) => `${t.id || "no-id"}: ${t.status}`)
      );

      const receiptIds = ticketChunk.map((t) => t.id).filter(Boolean);

      if (receiptIds.length > 0) {
        console.log("⏳ Waiting 2 seconds before fetching receipts...");
        await new Promise((r) => setTimeout(r, 2000));

        const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
        for (const rc of receiptChunks) {
          try {
            const rmap = await expo.getPushNotificationReceiptsAsync(rc);
            receipts.push(rmap);

            for (const [rid, info] of Object.entries(rmap)) {
              if (info?.status === "error") {
                receipt_errors.push({
                  receiptId: rid,
                  message: info?.message,
                  details: info?.details || null,
                });

                console.log(
                  `❌ RECEIPT ERROR rid=${rid} msg=${info?.message} details=${JSON.stringify(
                    info?.details || {}
                  )}`
                );
              } else {
                console.log(`📋 Receipt OK rid=${rid}`);
              }
            }
          } catch (e) {
            console.error("❌ Expo receipt fetch ERROR:", e?.message || e);
          }
        }
      }
    } catch (e) {
      console.error("💥 EXPO SEND ERROR:", e?.message || e);
      console.error(e);
    }
  }

  console.log("====================================");

  return {
    ok: true,
    sent: valid.length,
    invalid_count: invalid.length,
    invalid_samples: invalid.slice(0, 5),
    tickets,
    receipts,
    receipt_errors,
  };
}

// -------------------- Routes --------------------
app.get("/", (req, res) => res.send("CrashGuard API is running ✅"));

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    civilians: civilians.size,
    helpers: helpers.size,
    events: events.size,
  });
});

// ✅ Debug endpoint (SUPER useful)
app.get("/debug/state", (req, res) => {
  const civ = [];
  for (const c of civilians.values()) {
    civ.push({
      user_id: c.user_id,
      opt_in: c.opt_in,
      has_location: !!c.location,
      token_present: !!c.push_token,
      token_valid: !!c.push_token && Expo.isExpoPushToken(c.push_token),
      updated_at: c.updated_at,
    });
  }

  const hel = [];
  for (const h of helpers.values()) {
    hel.push({
      user_id: h.user_id,
      has_location: !!h.location,
      token_present: !!h.push_token,
      token_valid: !!h.push_token && Expo.isExpoPushToken(h.push_token),
      updated_at: h.updated_at,
    });
  }

  res.json({
    ok: true,
    counts: {
      civilians: civilians.size,
      helpers: helpers.size,
      events: events.size,
    },
    civilians: civ,
    helpers: hel,
    events: Array.from(events.values()).slice(-10),
  });
});

// -------------------- EVENTS --------------------

// Create event
app.post("/v1/events", (req, res) => {

  const parsed = createEventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
  }

  const id = `e_${uuid().slice(0, 8)}`;

  const event = {

    // ======================
    // BASIC EVENT DATA
    // ======================

    id,
    status: parsed.data.countdown_sec > 0 ? "COUNTDOWN" : "DISPATCHED",
    created_at: new Date().toISOString(),

    ...parsed.data,


    // ======================
    // RESCUE SYSTEM FIELDS
    // ======================

    rescued: false,              // person rescued or not
    transporting: false,         // ambulance transporting or not
    rescued_at: null,
    transport_started: null,


    // ======================
    // AMBULANCE INFO
    // ======================

    ambulance_id: null,
    hospital: null,


    // ======================
    // LIVE LOCATION TRACKING
    // ======================

    last_location_update: null,

  };

  events.set(id, event);

  console.log(`📍 New event ${id}: ${event.type}`);

  res.json({ event });

});

// Cancel event
app.post("/v1/events/:id/cancel", (req, res) => {
  const event = events.get(req.params.id);
  if (!event) return res.status(404).json({ error: "Not found" });

  event.status = "FALSE_ALARM";
  event.cancelled_at = new Date().toISOString();
  events.set(event.id, event);

  console.log(`❌ Cancelled event ${req.params.id}`);
  res.json({ ok: true, status: event.status, event });
});

// Dispatch event (push ON)
app.post("/v1/events/:id/dispatch", async (req, res) => {
  const event = events.get(req.params.id);
  if (!event) return res.status(404).json({ error: "Not found" });

  event.status = "DISPATCHED";
  event.dispatched_at = new Date().toISOString();
  events.set(event.id, event);

  const helperRadius = Number(req.body?.radius_m ?? 1500);

  /**
   * ✅ MAIN FIX:
   * default civilian radius ALWAYS 3000 (so 2 phones miss na kare)
   * optional override: req.body.civilian_radius_m
   */
  const civilianRadiusChosen = Number(req.body?.civilian_radius_m ?? 3000);

  console.log(
    `🚨 DISPATCH ${event.id} | helperRadius=${helperRadius} | civilianRadius=${civilianRadiusChosen}`
  );

  // Collect helper targets
  const helperTargets = [];
  for (const h of helpers.values()) {
    if (!h.location) continue;

    const d = distanceMeters(event.location, h.location);
    const ok = d <= helperRadius;
    if (ok) helperTargets.push({ user: h, distance_m: d });

    console.log(
      `🧭 HelperCheck user=${h.user_id} d=${Math.round(d)}m inRadius=${ok} tokenValid=${
        !!h.push_token && Expo.isExpoPushToken(h.push_token)
      }`
    );
  }

  // Collect civilian targets
  const civilianTargets = [];
  for (const c of civilians.values()) {
    if (!c.opt_in) continue;
    if (!c.location) continue;

    const d = distanceMeters(event.location, c.location);
    const ok = d <= civilianRadiusChosen;
    if (ok) civilianTargets.push({ user: c, distance_m: d });

    console.log(
      `🧭 CivilianCheck user=${c.user_id} d=${Math.round(d)}m inRadius=${ok} tokenValid=${
        !!c.push_token && Expo.isExpoPushToken(c.push_token)
      }`
    );
  }

  // Build messages
  const helperMsgs = helperTargets.map(({ user, distance_m }) => ({

    to: user.push_token,
    sound: "default",
    priority: "high",

    title: "🚨 CrashGuard Accident Alert",

    body:
    `Accident detected nearby

    Distance: ${Math.round(distance_m)} meters

    Tap to open location`,

      data: {
        type: "ACCIDENT_ALERT",
        eventId: event.id,
        lat: event.location.lat,
        lng: event.location.lng,
        mapLink: `https://maps.google.com/?q=${event.location.lat},${event.location.lng}`
      }
  }));


  const civilianMsgs = civilianTargets.map(({ user, distance_m }) => ({

    to: user.push_token,
    sound: "default",
    priority: "high",

    title: "🚨 Accident Nearby",

    body:
    `Someone may need help!

    Distance: ${Math.round(distance_m)} meters

    Tap to view location`,

      data: {
        type: "CIVILIAN_ALERT",
        eventId: event.id,
        lat: event.location.lat,
        lng: event.location.lng,
        mapLink: `https://maps.google.com/?q=${event.location.lat},${event.location.lng}`
      }
  }));

    // -------------------- FAMILY ALERT --------------------

  let familyMsgs = [];

  try {

    const victimUser = await User.findOne({ phone: event.phone });

    if (victimUser && victimUser.parentPhone) {

      const parentUser = await User.findOne({
        phone: victimUser.parentPhone
      });

      if (parentUser && parentUser.push_token) {

        familyMsgs.push({
          to: parentUser.push_token,
          sound: "default",
          priority: "high",

          title: "🚨 CrashGuard Family Alert",

          body:
    `Your family member may be in an accident

    Name: ${victimUser.name}
    Blood: ${victimUser.bloodGroup}
    Phone: ${victimUser.phone}

    Tap to view location`,

            data: {
              type: "FAMILY_ALERT",
              lat: event.location.lat,
              lng: event.location.lng,
              eventId: event.id
            }
          });

        }

      }

    } catch (err) {
      console.log("Family alert error", err.message);
    }

  console.log(
    `📊 Targets: helpers=${helperTargets.length}, civilians=${civilianTargets.length}`
  );

  const helperPush = await sendExpoPush(helperMsgs);
  const civilianPush = await sendExpoPush(civilianMsgs);
  const familyPush = await sendExpoPush(familyMsgs);

  res.json({
    ok: true,
    event,

    helper_radius_m: helperRadius,
    civilian_radius_m: civilianRadiusChosen,

    helpers_in_radius: helperTargets.length,
    civilians_in_radius: civilianTargets.length,

    push_sent_helpers: helperPush.sent,
    push_sent_civilians: civilianPush.sent,

    helper_invalid_tokens: helperPush.invalid_count,
    civilian_invalid_tokens: civilianPush.invalid_count,
    helper_invalid_samples: helperPush.invalid_samples,
    civilian_invalid_samples: civilianPush.invalid_samples,

    // ✅ NEW: receipts errors summary (most important)
    helper_receipt_errors: helperPush.receipt_errors,
    civilian_receipt_errors: civilianPush.receipt_errors,

    // ✅ debug: distances sample
    helper_targets_sample: helperTargets.slice(0, 10).map((t) => ({
      user_id: t.user.user_id,
      distance_m: Math.round(t.distance_m),
      token_present: !!t.user.push_token,
      token_valid: !!t.user.push_token && Expo.isExpoPushToken(t.user.push_token),
    })),
    civilian_targets_sample: civilianTargets.slice(0, 10).map((t) => ({
      user_id: t.user.user_id,
      distance_m: Math.round(t.distance_m),
      token_present: !!t.user.push_token,
      token_valid: !!t.user.push_token && Expo.isExpoPushToken(t.user.push_token),
    })),
  });
});


// ================= RESCUE CONFIRM =================
app.post("/v1/events/:id/rescue", async (req, res) => {

  const event = events.get(req.params.id);

  if (!event) return res.status(404).json({ error: "Event not found" });

  event.status = "RESCUED";
  event.rescued = true;
  event.ambulance_id = req.body.ambulance_id || "AMB-101";
  event.rescued_at = new Date().toISOString();

  events.set(event.id, event);

  console.log(`🚑 Event rescued: ${event.id}`);

  // notification to civilians
  const civilianMsgs = [];

  for (const c of civilians.values()) {

    if (!c.push_token) continue;

    civilianMsgs.push({
      to: c.push_token,
      sound: "default",
      title: "✅ Person Rescued",
      body: "Thank you for your kindness. Emergency handled by ambulance.",
      data: {
        type: "RESCUE_CONFIRMED",
        eventId: event.id
      }
    });

  }

  await sendExpoPush(civilianMsgs);

  res.json({ ok: true, event });

});

// ================= TRANSPORT START =================
app.post("/v1/events/:id/transport", async (req, res) => {

  const event = events.get(req.params.id);

  if (!event) return res.status(404).json({ error: "Event not found" });

  event.status = "TRANSPORTING";
  event.transport_started = new Date().toISOString();

  events.set(event.id, event);

  res.json({ ok: true, event });

});

// ================= LIVE LOCATION UPDATE =================
app.post("/v1/events/:id/location", (req, res) => {

  const event = events.get(req.params.id);

  if (!event) return res.status(404).json({ error: "Event not found" });

  const { lat, lng } = req.body;

  event.location = { lat, lng };
  event.updated_at = new Date().toISOString();

  events.set(event.id, event);

  res.json({ ok: true });

});

// Get event
app.get("/v1/events/:id", (req, res) => {
  const event = events.get(req.params.id);
  if (!event) return res.status(404).json({ error: "Not found" });
  res.json({ event });
});

// -------------------- HELPERS --------------------
app.post("/v1/helpers/register", (req, res) => {
  const schema = z.object({
    user_id: z.string().min(1),
    push_token: z.string().nullable().optional(),
    location: z.object({ lat: z.number(), lng: z.number() }),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
  }

  const helper = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  helpers.set(helper.user_id, helper);
  console.log(`👨‍⚕️ Helper registered: ${helper.user_id} | token=${!!helper.push_token}`);
  res.json({ ok: true, helper });
});

app.get("/v1/helpers/nearby", (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius_m = Number(req.query.radius_m || 1500);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat/lng required" });
  }

  const center = { lat, lng };
  const list = [];

  for (const h of helpers.values()) {
    if (!h.location) continue;
    const d = distanceMeters(center, h.location);
    if (d <= radius_m) list.push({ ...h, distance_m: Math.round(d) });
  }

  list.sort((a, b) => a.distance_m - b.distance_m);
  res.json({ ok: true, radius_m, count: list.length, helpers: list });
});

// -------------------- CIVILIANS --------------------
app.post("/v1/civilians/register", (req, res) => {
  const schema = z.object({
    user_id: z.string().min(1),
    push_token: z.string().nullable().optional(),
    location: z.object({ lat: z.number(), lng: z.number() }),
    opt_in: z.boolean().default(true),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
  }

  const civilian = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  civilians.set(civilian.user_id, civilian);
  console.log(
    `🧑 Civilian ${civilian.opt_in ? "ON" : "OFF"}: ${civilian.user_id} | token=${!!civilian.push_token}`
  );
  res.json({ ok: true, civilian });
});

app.get("/v1/civilians/nearby", (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius_m = Number(req.query.radius_m || 3000);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat/lng required" });
  }

  const center = { lat, lng };
  const list = [];

  for (const c of civilians.values()) {
    if (!c.opt_in) continue;
    if (!c.location) continue;
    const d = distanceMeters(center, c.location);
    if (d <= radius_m) list.push({ ...c, distance_m: Math.round(d) });
  }

  list.sort((a, b) => a.distance_m - b.distance_m);
  res.json({ ok: true, radius_m, count: list.length, civilians: list });
});

// -------------------- Polling endpoint (fallback) --------------------
app.get("/v1/events/nearby", (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "lat/lng required" });
  }

  const me = { lat, lng };

  const list = [];
  for (const e of events.values()) {
    if (e.status !== "DISPATCHED") continue;
    const d = distanceMeters(me, e.location);
    list.push({ event: e, distance_m: Math.round(d) });
  }
  list.sort((a, b) => a.distance_m - b.distance_m);

  const nearest = list[0];
  if (!nearest) return res.json({ ok: true, found: false });

  // ✅ keep radius 3000 default (consistent)
  const radius = Number(req.query.radius_m ?? 3000);

  if (nearest.distance_m <= radius) {
    return res.json({
      ok: true,
      found: true,
      radius_m: radius,
      distance_m: nearest.distance_m,
      event: nearest.event,
    });
  }

  return res.json({ ok: true, found: false, radius_m: radius });
});

// -------------------- Listen --------------------
app.listen(4000, "0.0.0.0", () => {
  console.log("🚀 CrashGuard API running: http://0.0.0.0:4000");
});