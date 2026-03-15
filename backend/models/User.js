const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  // ======================
  // AUTH DATA
  // ======================

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  verified: {
    type: Boolean,
    default: false,
  },

  // ======================
  // PROFILE DATA
  // ======================

  name: {
    type: String,
    default: "",
    trim: true,
  },

  bloodGroup: {
    type: String,
    default: "",
  },

  phone: {
    type: String,
    default: "",
  },

  address: {
    type: String,
    default: "",
  },

  parentPhone: {
    type: String,
    default: "",
  },

  familyLinked: {
  type: Boolean,
  default: false
  },

  push_token: {
    type: String,
    default: ""
  },

  // ======================
  // PROFILE IMAGE (future)
  // ======================

  avatar: {
    type: String,
    default: "",
  },

  // ======================
  // ACCOUNT INFO
  // ======================

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  }

});

// ⭐ Auto update updatedAt
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);