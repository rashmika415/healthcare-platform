const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
    },

    hospital: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔐 Verification status
    isVerified: {
      type: Boolean,
      default: false,
    },

    // 🔄 Track verification time
    verifiedAt: {
      type: Date,
      default: null,
    },

    // 👑 Who verified this doctor (admin ID)
    verifiedBy: {
      type: String,
      default: null,
    },

    // 🔔 Optional: track if email sent
    verificationEmailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);