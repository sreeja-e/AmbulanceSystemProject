const express = require("express");
const { body } = require("express-validator");
const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const {
  listRequests,
  acceptRequest,
  locationUpdate,
  completeRequest,
} = require("../controllers/driverController");

const router = express.Router();

router.get("/requests", authRequired, requireRole("DRIVER"), listRequests);

router.post(
  "/accept",
  authRequired,
  requireRole("DRIVER"),
  [body("requestId").isString().isLength({ min: 1 }), body("action").isIn(["accept", "reject"])],
  acceptRequest
);

router.post(
  "/location-update",
  authRequired,
  requireRole("DRIVER"),
  [body("lat").isFloat({ min: -90, max: 90 }), body("lng").isFloat({ min: -180, max: 180 })],
  locationUpdate
);

router.post(
  "/complete",
  authRequired,
  requireRole("DRIVER"),
  [body("requestId").isString().isLength({ min: 1 })],
  completeRequest
);

module.exports = router;

