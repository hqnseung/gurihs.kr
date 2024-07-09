const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema(
  {
    userId: {
      type: String
    },
    userName: {
      type: String
    },
    point: {
      type: Number
    },
    reason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const Log = mongoose.model('Log', LogSchema);

module.exports = Log;
