const User = require("../models/user");
const { isEmail, isLength, isEmpty } = require("validator");
const Post = require("../models/posts");
const { hash, compare } = require("bcryptjs");
const { sign } = require("jsonwebtoken");
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

    const post = new Post({
      title,
      content,
      imageUrl,
    });

    const createdPost = await post.save();
//add post to user's posts
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
};
