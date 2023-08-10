const express = require("express");
const User = require("../models/user");
const { body } = require("express-validator");
const router = express.Router();

const { signup, login} = require("../controllers/authController");

router.put(
  "/signup",
  [
    body("email", "Please enter a valid email")
      .isEmail()
      .normalizeEmail()
      .trim()
      .not()
      .isEmpty()
      .custom((value) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email address already exists");
          }
        });
      }),
    body("password", "Please enter a valid password")
      .trim()
      .isLength({ min: 7 })
      .withMessage("Password must 7 characters and above")
      .not()
      .isEmpty(),
    body("name", "Please enter a valid name")
      .trim()
      .isLength({ min: 3 })
      .not()
      .isEmpty(),
  ],
  signup,
);

router.post('/login', login)

module.exports = router;
