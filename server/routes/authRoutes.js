const express = require("express");
const { body } = require("express-validator");
const { register, login } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").isString().isLength({ min: 2 }).trim(),
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 6 }),
    body("role").optional().isIn(["USER", "DRIVER"]),
  ],
  register
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").isString().isLength({ min: 1 })],
  login
);

module.exports = router;

