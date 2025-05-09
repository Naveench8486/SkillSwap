const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: Number,
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
  skills: {
    type: [String],
    default: [],
  },
  certifications: {
    type: [String], // Stores uploaded filenames
    default: [],
  },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
