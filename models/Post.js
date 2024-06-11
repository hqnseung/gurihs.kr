const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    id: {
      type: String
    },
    title: {
      type: String
    },
    author: {
      type: String
    },
    view: {
      type: Number,
      default: 0
    },
    html: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
