const express = require("express");
const {
  getPosts,
  createPost,
  getPost,
  updatePost, deletePost,
} = require("../controllers/feedsController");
const { body } = require("express-validator");

const router = express.Router();
// GET /feeds/posts
router.get("/posts", getPosts);

// POST /feeds/post
router.post(
  "/post",
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  createPost,
);

router.get("/post/:postId", getPost);

router.put(
  "/post/:postId",
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  updatePost,
);

router.delete("/post/:postId", deletePost);
module.exports = router;
