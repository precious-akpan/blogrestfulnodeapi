const fs = require("fs");
const { join } = require("path");
const { validationResult } = require("express-validator");
const Post = require("../models/posts");
const User = require("../models/user");
// const io = require("../socket");
const clearImage = (filePath) => {
    fs.unlink(join(__dirname, "..", filePath), (error) =>
        console.log("error", error)
    );
};

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    try {
        totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate("creator")
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        return res.status(200).json({
            message: "Post fetched successfully",
            posts: posts,
            totalItems: totalItems,
        });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.createPost = async (req, res, next) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        const error = new Error(
            "Validation failed, entered data is incorrect!"
        );
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    if (!req.file) {
        const error = new Error("No image provided!");
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path;
    const post = new Post({
        title,
        content,
        imageUrl: imageUrl,
        creator: req.userId,
    });
    try {
        await post.save();
        const user = await User.findOne({ _id: req.userId });
        creator = user;
        user.posts.push(post);
        const savedUser = await user.save();
        res.status(201).json({
            message: "Post created successfully!",
            post: post,
            creator: { _id: creator._id, name: creator.name },
        });
        return savedUser;
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.getPost = async (req, res, next) => {
    const { postId } = req.params;
    try {
        const post = await Post.findById(postId);
        // .then((post) => {
        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
        }

        res.status(200).json({ message: "Pose fetched", post });
        // })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.updatePost = async (req, res, next) => {
    const { postId } = req.params;
    const error = validationResult(req);
    if (!error.isEmpty()) {
        const error = new Error(
            "Validation failed, entered data is incorrect!"
        );
        error.statusCode = 422;
        throw error;
    }
    const { title, content } = req.body;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error("No file selected!");
        error.statusCode = 422;
        throw error;
    }
    try {
        const post = await Post.findById(postId).populate("creator");
        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            return error;
        }
        if (post.imageUrl !== imageUrl) {
            clearImage(post.imageUrl);
        }
        if (post.creator._id.toString() !== req.userId) {
            const error = new Error("Unauthorized edit request");
            error.statusCode = 403;
            return error;
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        const result = await post.save();
        res.status(200).json({ message: "Post updated!", post: result });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
};

exports.deletePost = async (req, res, next) => {
    const { postId } = req.params;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error("Post not found");
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error("Unauthorized request");
            error.statusCode = 403;
            throw error;
        }
        clearImage(post.imageUrl);
        await Post.findByIdAndRemove(postId);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();
        res.status(200).json({ message: "Deleted post" });
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 404;
        }
        next(error);
    }
};
