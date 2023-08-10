const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { email, name, password } = req.body;
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email,
        password: hashedPassword,
        name,
      });
      return user.save();
    })
    .then((result) => {
      res.status(201).json({ message: "User created", userId: result._id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;
    User.findOne({ email })
    .then((user) => {
      if (!user) {
        const error = new Error("User does not exist.");
        error.statusCode = 404;
        throw error;
      }
      return bcrypt
        .compare(password, user.password)
        .then((isEqual) => {
          if (!isEqual) {
            const error = new Error("Invalid password");
            error.statusCode = 401;
            throw error;
          }
          const token = jwt.sign(
            {
              email: user.email,
              userId: user._id.toString(),
            },
            "sophisticatedsecretkey",
            { expiresIn: "1h" },
          );
          res
            .status(200)
            .json({
              message: "Login successful",
              token,
              userId: user._id.toString(),
            });
        })
        .catch((error) => {
          throw error;
        });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
        error.data = "Something went wrong.";
      }
      next(error);
    });
};
