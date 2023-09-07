const User = require("../models/user");
const { isEmail, isLength, isEmpty } = require("validator");
const Post = require("../models/posts");
const { hash, compare } = require("bcryptjs");
const { sign } = require("jsonwebtoken");
const clearImage = require("../utils/imageCleaner");
module.exports = {
  createUser: async function ({ userInput }, req) {
    const { email, name, password } = userInput;
    // const email = userInput.email;
    // const name = userInput.name;
    // const password = userInput.password;
    const errors = [];
    if (!isEmail(email)) {
      errors.push({ message: "Email is invalid" });
    }
    if (isEmpty(password) || !isLength(password, { min: 6 })) {
      errors.push({ message: "Password too short." });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const existingUser = await User.findOne({ email });
    console.log(existingUser);
    if (existingUser) {
      throw new Error("User already exist");
    }

    const hashedPassword = await hash(password, 12);
    const user = new User({
      email,
      password: hashedPassword,
      name,
    });

    const createdUser = await user.save();

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  async login({ email, password }) {
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User does not exist");
      error.code = 401;
      throw error;
    }
    if (!(await compare(password, user.password))) {
      const error = new Error("Password mismatch");
      error.code = 401;
      throw error;
    }

    const token = sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      "supersecretsecretkey",
      { expiresIn: "1h" },
    );

    return { token, userId: user._id.toString() };
  },

  async createPost({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthorized request");
      error.code = 401;
      throw error;
    }
    const { title, content, imageUrl } = postInput;
    const errors = [];
    if (isEmpty(title) || !isLength(title, { min: 3 })) {
      errors.push({ message: "Title is invalid" });
    }
    if (isEmpty(content) || !isLength(content, { min: 3 })) {
      errors.push({ message: "Content is invalid" });
    }
    if (isEmpty(imageUrl)) {
      errors.push({ message: "imageUrl is invalid" });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid user");
      error.code = 401;
      throw error;
    }

    const post = new Post({
      title,
      content,
      imageUrl,
      creator: user,
    });

    const createdPost = await post.save();
    //add post to user's posts
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },

  async loadAllPosts({ page }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthorised request");
      error.code = 401;
      throw error;
    }
    if (!page) page = 1;
    const perPage = 2;
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("creator");

    return {
      posts: posts.map((p) => ({
        ...p._doc,
        _id: p._id.toString(),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      totalItems,
    };
  },

  async loadPost({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthorized request");
      error.code = 401;
      throw new error();
    }

    const post = await Post.findById(id).populate("creator");

    if (!post) {
      const error = new Error("Post not found");
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

  async editPost({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthorized action");
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate("creator");
    if (!post) {
      const error = new Error("Post not found.");
      error.code = 404;
      throw error;
    }

    if (req.userId.toString() !== post.creator._id.toString()) {
      const error = new Error("Unauthorized action");
      error.code = 403;
      throw error;
    }

    const { title, content, imageUrl } = postInput;
    const errors = [];
    if (isEmpty(title) || !isLength(title, { min: 3 })) {
      errors.push({ message: "Title is invalid" });
    }
    if (isEmpty(content) || !isLength(content, { min: 3 })) {
      errors.push({ message: "Content is invalid" });
    }
    if (isEmpty(imageUrl)) {
      errors.push({ message: "imageUrl is invalid" });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    post.title = title;
    post.content = content;
    if (imageUrl !== "undefined") post.imageUrl = imageUrl;

    const editedPost = await post.save();

    return {
      ...editedPost._doc,
      _id: editedPost._id.toString(),
      createdAt: editedPost.createdAt.toISOString(),
      updatedAt: editedPost.updatedAt.toISOString(),
    };
  },

  async deletePost({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("Unauthorized user action");
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id);
    if (!post) {
      const error = new Error("Post not found");
      error.code = 404;
      throw error;
    }

    if (req.userId.toString() !== post.creator.toString()) {
      const error = new Error("Unauthorized action");
      error.code = 403;
      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(id);
    const user = await User.findById(req.userId);
    await user.posts.pull(id);
    await user.save();

    return true;
  },
  async user(args, req) {
    if (!req.isAuth) {
      const error = new Error("User not authenticated");
      error.code = 403;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found.");
      error.code = 404;
      throw error;
    }
    return {
      ...user._doc,
      id: user._id.toString(),
    };
  },

  async updateStatus({status}, req) {
    if (!req.isAuth) {
      const error = new Error('User not authenticated.')
      error.code = 404
      throw error
    }

    const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error('User not found.')
      error.code = 404
      throw error
    }

    user.status = status
    await user.save()
    return {...user._doc, id: user._id.toString()}

  }
};
