const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    id: {
      type: String
    },
    name: {
      type: String
    },
    point: {
      type: Number
    },
    role: {
      type: String,
      default: "general"
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', UserSchema); //users

module.exports = User;
