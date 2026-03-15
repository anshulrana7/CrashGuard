const mongoose = require("mongoose");

async function connectDB() {
  try {

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "crashguard"
    });

    console.log("✅ MongoDB Connected");

  } catch (err) {

    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);

  }
}

module.exports = connectDB;