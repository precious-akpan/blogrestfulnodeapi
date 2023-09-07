const { describe, after, it } = require("mocha");
const FeedsController = require("../controllers/feedsController");
const mongoose = require("mongoose");
const User = require("../models/user");
const Post = require("../models/posts");
const { expect } = require("chai");

describe("Feeds controller", function () {
    before(function (done) {
        mongoose
            .connect("mongodb://localhost:27017/test-messages")
            .then(() => {
                const user = new User({
                    name: "Test Test",
                    email: "test@test.com",
                    password: "password",
                    posts: [],
                    _id: "5c0f66b979af55031b34728a",
                });

                return user.save();
            })
            .then(() => {
                done();
            });
    });
    it("Should add a created post to the posts of the creator", function (done) {
        const req = {
            body: {
                title: "Test Title",
                content: "Test content.",
            },
            file: { path: "abc" },
            userId: "5c0f66b979af55031b34728a",
        };
        const res = {
            status: function () {
                return this;
            },
            json: function () {},
        };

        FeedsController.createPost(req, res, () => {}).then((savedUser) => {
            expect(savedUser).to.have.property("posts");
            expect(savedUser.posts).to.have.length(1);
            done();
        });
    });

    after(function (done) {
        Post.deleteMany({})
            .then(() => {
                return User.deleteMany({});
            })
            .then(() => {
                return mongoose.disconnect();
            })
            .then(() => done());
    });
});
