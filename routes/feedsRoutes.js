const express = require("express");
const {
  getPosts,
  createPost,
  getPost,
  updatePost,
  deletePost,
} = require("../controllers/feedsController");
const { body } = require("express-validator");
const isAuth = require("../middleware/is-auth");

const router = express.Router();
// GET /feeds/posts
router.get("/posts", isAuth, getPosts);

// POST /feeds/post
router.post(
  "/post",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  createPost,
);

router.get("/post/:postId", isAuth, getPost);

router.put(
  "/post/:postId",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  updatePost,
);

router.delete("/post/:postId", isAuth, deletePost);
module.exports = router;
