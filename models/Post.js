const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    id: {
      type: String
    },
    author: {
      type: String
    },
    view: {
      type: Number,
      default: 0
    },
    mainPicture: {
      type: String
    },
    title: {
      type: String
    },
    content: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
