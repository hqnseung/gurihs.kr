const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String
    },
    author: {
      type: String
    },
    view: {
      type: Number
    },
    html: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const Post = mongoose.model('Post', BoardSchema);

module.exports = Post;
