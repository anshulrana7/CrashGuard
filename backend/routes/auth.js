const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// ================= EMAIL TRANSPORT =================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================================================
// SIGNUP
// ======================================================

router.post("/signup", async (req, res) => {

  try {

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required"
      });
    }

    const existing = await User.findOne({
      email: email.toLowerCase()
    });

    if (existing)
      return res.status(400).json({
        error: "Email already exists"
      });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const verifyLink =
      `http://localhost:4000/v1/auth/verify/${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your CrashGuard account",
      html: `
        <h2>CrashGuard Email Verification</h2>
        <p>Click below to verify your account:</p>
        <a href="${verifyLink}">${verifyLink}</a>
      `,
    });

    res.json({
      message:
        "Signup successful. Please check your email to verify."
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// ======================================================
// VERIFY EMAIL
// ======================================================

router.get("/verify/:token", async (req, res) => {

  try {

    const decoded = jwt.verify(
      req.params.token,
      process.env.JWT_SECRET
    );

    await User.findByIdAndUpdate(decoded.id, {
      verified: true,
    });

    res.send("✅ Email verified successfully. You can now login.");

  } catch (err) {

    res.status(400).send("Invalid or expired verification link.");

  }

});

// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {

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

// ======================================================
// FORGOT PASSWORD
// ======================================================

router.post("/forgot", async (req, res) => {

  try {

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

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// ======================================================
// GET PROFILE
// ======================================================

router.get("/profile", authMiddleware, async (req, res) => {

  try {

    const user = await User.findById(req.user.id)
      .select("-password");

    res.json(user);

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// -------- SAVE PUSH TOKEN --------
router.put("/push-token", authMiddleware, async (req, res) => {

  try {

    const { push_token } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { push_token },
      { returnDocument: "after" }
    ).select("-password");

    res.json({
      message: "Push token saved",
      user
    });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

// ======================================================
// UPDATE PROFILE
// ======================================================

router.put("/profile", authMiddleware, async (req, res) => {

  try {

    const {
      name,
      bloodGroup,
      phone,
      address,
      parentPhone
    } = req.body;

    const user = await User.findByIdAndUpdate(

      req.user.id,

      {
        name,
        bloodGroup,
        phone,
        address,
        parentPhone
      },

      { returnDocument: "after" }

    ).select("-password");

    // ⭐ AUTO FAMILY LINK CHECK
    if (user.parentPhone) {

      const parent = await User.findOne({ phone: user.parentPhone });

      if (parent) {

        await User.findByIdAndUpdate(user._id, {
          familyLinked: true
        });

        await User.findByIdAndUpdate(parent._id, {
          familyLinked: true
        });

        console.log("✅ Family linked:", user.phone, "<->", parent.phone);

      } else {

        console.log("Parent account not found yet");

      }

    }

    res.json(user);

  } catch (err) {

    console.log(err);

    res.status(500).json({ error: "Profile update failed" });

  }

});

module.exports = router;