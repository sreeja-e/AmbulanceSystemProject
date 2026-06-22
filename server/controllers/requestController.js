const { validationResult } = require("express-validator");
const { prisma } = require("../utils/prisma");
const { haversineKm } = require("../utils/distance");
const { getIO } = require("../sockets");

async function createRequest(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { lat, lng, ambulanceType } = req.body;
  const userId = req.user.id;

  const availableAmbulances = await prisma.ambulance.findMany({
    where: { available: true },
    include: { driver: true },
  });

  let chosen = null;
  let min = Infinity;
  for (const amb of availableAmbulances) {
    const d = haversineKm(lat, lng, amb.lat, amb.lng);
    if (d < min) {
      min = d;
      chosen = amb;
    }
  }

  const created = await prisma.request.create({
    data: {
      userId,
      lat,
      lng,
      ambulanceType,
      status: chosen ? "pending" : "pending",
      ambulanceId: chosen ? chosen.id : null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      ambulance: { include: { driver: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (chosen) {
    await prisma.ambulance.update({
      where: { id: chosen.id },
      data: { available: false, status: "assigned" },
    });

    const io = getIO();
    io.to(`user:${chosen.driverId}`).emit("new_request", {
      request: created,
      distanceKm: min,
    });
  }

  return res.status(201).json({ request: created });
}

async function getRequest(req, res) {
  const requestId = req.params.id;
  const me = req.user;

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      ambulance: {
        include: {
          driver: { select: { id: true, name: true, email: true } },
          locationUpdates: { orderBy: { timestamp: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!request) return res.status(404).json({ message: "Request not found" });

  const isOwner = request.userId === me.id;
  const isAdmin = me.role === "ADMIN";
  const isAssignedDriver = me.role === "DRIVER" && request.ambulance?.driverId === me.id;

  if (!isOwner && !isAdmin && !isAssignedDriver) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({ request });
}

module.exports = { createRequest, getRequest };

